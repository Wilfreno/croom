import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAUTH_STATE_COOKIE } from '@repo/constants';
import { requireEnv } from '@repo/utils';
import type { FastifyReply } from 'fastify';

/**
 * Sends a failed google handshake back to the login page.
 *
 * The oauth legs are top-level browser navigations, so the app-wide filter's
 * json envelope would be rendered as a page: somebody who declines consent, or
 * arrives with a stale state, would be looking at a raw error body on the api's
 * domain with no way back. A redirect puts them somewhere they can try again.
 *
 * The reason is deliberately not passed on in the query. Whatever went wrong is
 * worth logging on the server, but telling the browser which part of the
 * handshake failed only helps somebody probing it.
 */
@Catch()
export class OAuthFailureFilter implements ExceptionFilter {
  private readonly logger = new Logger(OAuthFailureFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse<FastifyReply>();

    this.logger.error(
      exception instanceof Error ? exception.message : 'google sign-in failed',
      exception instanceof Error ? exception.stack : undefined,
    );

    const clientUrl = requireEnv(this.configService, 'CLIENT_URL').replace(
      /\/+$/,
      '',
    );

    reply.clearCookie(OAUTH_STATE_COOKIE, {
      path: '/v1/auth/google/callback',
    });

    void reply.redirect(`${clientUrl}/login?error=google`, HttpStatus.FOUND);
  }
}
