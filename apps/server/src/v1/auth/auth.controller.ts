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
import {
  LOGIN_REQUEST_LIMIT,
  LOGIN_REQUEST_WINDOW,
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
} from '@repo/constants';
import { RateLimit } from '@repo/guards';
import { requireEnv } from '@repo/utils';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ResponseMessage } from '../../common/decorators/server-response.decorator';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { OAuthFailureFilter } from './filters/oauth-failure.filter';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { AuthenticatedUser } from '@repo/types';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private readonly clientUrl: string;

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    this.clientUrl = requireEnv(configService, 'CLIENT_URL').replace(
      /\/+$/,
      '',
    );
  }

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
    await this.authService.startSession(user, request, reply);

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
    await this.authService.startSession(user, request, reply);

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

    reply.clearCookie(SESSION_COOKIE, this.authService.cookieOptions());

    return reply.redirect(`${this.clientUrl}/login`, HttpStatus.FOUND);
  }
}
