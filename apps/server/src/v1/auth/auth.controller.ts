import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { CookieSerializeOptions } from '@fastify/cookie';
import {
  LOGIN_REQUEST_LIMIT,
  LOGIN_REQUEST_WINDOW,
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  SESSION_LIFETIME_SECONDS,
} from '@repo/constants';
import { RateLimit } from '@repo/guards';
import type { AuthenticatedUser } from '@repo/types';
import { requireEnv } from '@repo/utils';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ResponseMessage } from '../../common/decorators/server-response.decorator';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { OAuthFailureFilter } from './filters/oauth-failure.filter';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private readonly clientUrl: string;
  private readonly inProduction: boolean;

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    this.clientUrl = requireEnv(configService, 'CLIENT_URL').replace(
      /\/+$/,
      '',
    );
    this.inProduction = configService.get<string>('NODE_ENV') === 'production';
  }

  /**
   * `httpOnly` keeps the token out of reach of any script on the page, so an
   * XSS bug cannot walk off with the session.
   *
   * `sameSite` differs by environment because the deployment does. In
   * development the client and the api are two ports on localhost, which
   * counts as one site, so `lax` holds and still blocks cross-site requests.
   * In production they are separate domains, and `lax` would drop the cookie
   * on every api call -- `none` is the only value that works, at the cost of
   * the browser's own csrf protection. What stands in for it there is cors:
   * a cross-site request carrying json triggers a preflight, and the allowed
   * origin is pinned to CLIENT_URL in `main.ts`.
   */
  private cookieOptions(maxAge?: number): CookieSerializeOptions {
    return {
      httpOnly: true,
      secure: this.inProduction,
      sameSite: this.inProduction ? 'none' : 'lax',
      path: '/',
      maxAge,
    };
  }

  /**
   * Opens a session for a user a strategy has already identified and puts the
   * token in the cookie. Shared by both sign-in routes, so the local and google
   * paths cannot end up with cookies that differ.
   */
  private async startSession(
    user: AuthenticatedUser,
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const token = await this.authService.issueSession(user, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    reply.setCookie(
      SESSION_COOKIE,
      token,
      this.cookieOptions(SESSION_LIFETIME_SECONDS),
    );
  }

  /**
   * `LocalStrategy` reads the body and rejects a wrong password before this
   * runs, so reaching the handler already means the credentials were good.
   *
   * `LoginDto` is declared for the shape it documents, not for validation:
   * guards run ahead of pipes, so passport sees the raw body first and a
   * missing field is answered by the strategy rather than by `ValidationPipe`.
   */
  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('local/login')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    limit: LOGIN_REQUEST_LIMIT,
    window: LOGIN_REQUEST_WINDOW,
    by: 'body.email',
  })
  @ResponseMessage('logged in')
  async login(
    @Body() _credentials: LoginDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    await this.startSession(user, request, reply);

    return user;
  }

  /**
   * Hands the browser to google. The guard answers with the redirect, so the
   * handler is never reached and exists only to hang the route on.
   */
  @Public()
  @UseFilters(OAuthFailureFilter)
  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  googleLogin() {
    return;
  }

  /**
   * Where google sends the browser back. The guard has run the code exchange
   * and `GoogleStrategy` has resolved the account by the time this runs, so all
   * that is left is the session every other sign-in gets.
   */
  @Public()
  @UseFilters(OAuthFailureFilter)
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    await this.startSession(user, request, reply);

    reply.clearCookie(OAUTH_STATE_COOKIE, { path: '/v1/auth/google/callback' });

    return reply.redirect(this.clientUrl, HttpStatus.FOUND);
  }

  /**
   * How the client learns who it is. The cookie is `httpOnly`, so the browser
   * can send it but never read it -- asking is the only way.
   */
  @Get('session')
  @ResponseMessage('request successful')
  session(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  /**
   * Public so that an already-dead session still gets its cookie cleared
   * instead of being turned away by the guard.
   *
   * Redirects rather than answering with json because the client navigates to
   * it, which is also why it is a GET.
   */
  @Public()
  @Get('logout')
  async logout(@Req() request: FastifyRequest, @Res() reply: FastifyReply) {
    const token = request.cookies?.[SESSION_COOKIE];

    if (token) await this.authService.logout(token);

    reply.clearCookie(SESSION_COOKIE, this.cookieOptions());

    return reply.redirect(`${this.clientUrl}/login`, HttpStatus.FOUND);
  }
}
