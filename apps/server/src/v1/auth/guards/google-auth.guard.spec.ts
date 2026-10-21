import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_LIFETIME_SECONDS,
} from '@repo/constants';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OAUTH_STATE } from '../strategies/cookie-state.store';
import { GoogleAuthGuard } from './google-auth.guard';

/**
 * The guard calls through to passport's own `canActivate` once it is done, and
 * that would try to run the real oauth handshake. Stubbing the base leaves the
 * two things this subclass adds -- the response shim and the state -- as the
 * only behavior under test.
 */
vi.mock('@nestjs/passport', () => ({
  AuthGuard: () =>
    class {
      async canActivate() {
        return true;
      }
    },
}));

function contextFor(query: Record<string, string> = {}) {
  const request: Record<string | symbol, unknown> = { query, cookies: {} };
  const reply = {
    header: vi.fn(),
    send: vi.fn(),
    setCookie: vi.fn(),
  };

  return {
    request,
    reply,
    context: {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => reply,
      }),
    } as unknown as ExecutionContext,
  };
}

const guard = (nodeEnv?: string) =>
  new GoogleAuthGuard({
    get: () => nodeEnv,
  } as unknown as ConfigService);

const stateCookie = (reply: { setCookie: ReturnType<typeof vi.fn> }) =>
  reply.setCookie.mock.calls[0];

describe('GoogleAuthGuard', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('the response passport writes through', () => {
    // Passport redirects with node's api, which a FastifyReply does not have.
    // Without the bridge the handoff to google dies before the browser moves.
    it('gives the reply the setHeader and end passport calls', async () => {
      const { context, reply } = contextFor();

      await guard().canActivate(context);

      const bridged = reply as unknown as {
        setHeader: (n: string, v: string) => void;
        end: () => void;
      };
      expect(typeof bridged.setHeader).toBe('function');
      expect(typeof bridged.end).toBe('function');
    });

    it('routes setHeader onto the fastify equivalent', async () => {
      const { context, reply } = contextFor();

      await guard().canActivate(context);
      (
        reply as unknown as { setHeader: (n: string, v: string) => void }
      ).setHeader('Location', 'https://accounts.google.com');

      expect(reply.header).toHaveBeenCalledWith(
        'Location',
        'https://accounts.google.com',
      );
    });

    it('routes end onto the fastify equivalent', async () => {
      const { context, reply } = contextFor();

      await guard().canActivate(context);
      (reply as unknown as { end: () => void }).end();

      expect(reply.send).toHaveBeenCalled();
    });
  });

  describe('oauth state', () => {
    it('mints a state on the way out to google', async () => {
      const { context, request, reply } = contextFor();

      await guard().canActivate(context);

      expect(request[OAUTH_STATE]).toEqual(expect.any(String));
      expect(stateCookie(reply)[0]).toBe(OAUTH_STATE_COOKIE);
      expect(stateCookie(reply)[1]).toBe(request[OAUTH_STATE]);
    });

    it('never mints the same state twice', async () => {
      const first = contextFor();
      const second = contextFor();

      await guard().canActivate(first.context);
      await guard().canActivate(second.context);

      expect(first.request[OAUTH_STATE]).not.toBe(second.request[OAUTH_STATE]);
    });

    // The cookie is what the returning leg is checked against, so minting a new
    // one there would overwrite the value being verified and let anything pass.
    it('leaves the cookie alone on the way back from google', async () => {
      const { context, reply } = contextFor({ code: 'from-google' });

      await guard().canActivate(context);

      expect(reply.setCookie).not.toHaveBeenCalled();
    });

    it('keeps the cookie out of reach of scripts and off every other route', async () => {
      const { context, reply } = contextFor();

      await guard().canActivate(context);

      expect(stateCookie(reply)[2]).toMatchObject({
        httpOnly: true,
        path: '/v1/auth/google/callback',
        maxAge: OAUTH_STATE_LIFETIME_SECONDS,
      });
    });

    // Lax, not strict: the callback arrives as a top-level navigation from
    // google, and strict would drop the cookie on the way in.
    it('uses a sameSite the callback navigation survives', async () => {
      const { context, reply } = contextFor();

      await guard().canActivate(context);

      expect(stateCookie(reply)[2].sameSite).toBe('lax');
    });

    it('requires https for the cookie in production only', async () => {
      const dev = contextFor();
      const prod = contextFor();

      await guard().canActivate(dev.context);
      await guard('production').canActivate(prod.context);

      expect(stateCookie(dev.reply)[2].secure).toBe(false);
      expect(stateCookie(prod.reply)[2].secure).toBe(true);
    });
  });
});
