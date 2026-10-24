import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_LIFETIME_SECONDS,
} from '@repo/constants';
import { randomBytes } from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { OAUTH_STATE } from '../strategies/cookie-state.store';

/**
 * `AuthGuard('google')` with the two things the fastify adapter needs.
 *
 * The first is a response that answers to node's api. Passport sends its
 * redirect by assigning `res.statusCode` and calling `res.setHeader()` then
 * `res.end()`, which is what an express response offers. Nest's fastify adapter
 * hands it a `FastifyReply`, which does the same work through `header()` and
 * `send()` and has neither of the other two, so the handoff to google dies with
 * `res.setHeader is not a function` before the browser is ever redirected.
 *
 * The second is the oauth `state` value. `CookieStateStore` reads it off the
 * request on the way out and out of the cookie on the way back; minting it here
 * is what lets the store stay a plain object with no access to the reply.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();

    this.teachNodeResponseApi(reply);

    // Google sends the browser back carrying `code`, which is what separates
    // the return leg from the outbound one. Only the outbound leg mints state;
    // the return leg has to keep the cookie it is about to be checked against.
    const returning = Boolean((request.query as { code?: string })?.code);

    if (!returning) this.mintState(request, reply);

    return (await super.canActivate(context)) as boolean;
  }

  private teachNodeResponseApi(reply: FastifyReply): void {
    const raw = reply as unknown as {
      setHeader?: (name: string, value: string) => void;
      end?: () => void;
    };

    raw.setHeader ??= (name, value) => {
      reply.header(name, value);
    };
    raw.end ??= () => {
      void reply.send();
    };
  }

  /**
   * Puts a fresh state value where both legs can reach it: on the request for
   * the store to hand google, and in a cookie for the callback to check it
   * against. Scoped to the callback path so it is sent on nothing else, and
   * short-lived so an abandoned handshake cannot be finished hours later.
   *
   * `lax` rather than `strict`: the callback arrives as a top-level navigation
   * from google's domain, which lax allows and strict would not, taking the
   * cookie with it.
   */
  private mintState(request: FastifyRequest, reply: FastifyReply): void {
    const state = randomBytes(16).toString('hex');

    (request as unknown as Record<symbol, string>)[OAUTH_STATE] = state;

    reply.setCookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/v1/auth/google/callback',
      maxAge: OAUTH_STATE_LIFETIME_SECONDS,
    });
  }
}
