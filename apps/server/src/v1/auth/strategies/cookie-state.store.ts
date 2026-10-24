import { OAUTH_STATE_COOKIE } from '@repo/constants';
import { timingSafeEqual } from 'crypto';
import type { FastifyRequest } from 'fastify';

/** Where `GoogleAuthGuard` leaves the state it minted for this request. */
export const OAUTH_STATE = Symbol('oauth:state');

type StoreCallback = (error: Error | null, state?: string) => void;
type VerifyCallback = (
  error: Error | null,
  ok?: boolean,
  info?: { message: string },
) => void;

/**
 * Carries the oauth `state` value in a cookie instead of a server session.
 *
 * Without a state parameter the callback accepts any code that reaches it, so
 * an attacker can send a victim's browser a link that completes the attacker's
 * google handshake and quietly signs the victim into the attacker's account.
 * Passport's own state support wants `req.session`, which this app does not
 * have and does not want -- the whole point of the session design is that
 * nothing but an id is kept.
 *
 * A cookie covers it: the value goes out with the redirect and comes back on
 * the callback, so only the browser that started the handshake can finish it.
 */
export class CookieStateStore {
  store(request: FastifyRequest, callback: StoreCallback): void {
    const state = (request as unknown as Record<symbol, string | undefined>)[
      OAUTH_STATE
    ];

    if (!state)
      return callback(
        new Error('oauth state was not prepared for this request'),
      );

    callback(null, state);
  }

  verify(
    request: FastifyRequest,
    provided: string,
    callback: VerifyCallback,
  ): void {
    const expected = request.cookies?.[OAUTH_STATE_COOKIE];

    if (!expected || !provided)
      return callback(null, false, { message: 'oauth state is missing' });

    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    const matched = a.length === b.length && timingSafeEqual(a, b);

    if (!matched)
      return callback(null, false, { message: 'oauth state did not match' });

    callback(null, true);
  }
}
