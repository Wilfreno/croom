import { OAUTH_STATE_COOKIE } from '@repo/constants';
import type { FastifyRequest } from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import { CookieStateStore, OAUTH_STATE } from './cookie-state.store';

const STATE = 'a1b2c3d4e5f6';

function request({
  cookie,
  minted,
}: { cookie?: string; minted?: string } = {}): FastifyRequest {
  const req: Record<string | symbol, unknown> = {
    cookies: cookie ? { [OAUTH_STATE_COOKIE]: cookie } : {},
  };

  if (minted) req[OAUTH_STATE] = minted;

  return req as unknown as FastifyRequest;
}

describe('CookieStateStore', () => {
  describe('store', () => {
    it('hands passport the state the guard minted', () => {
      const callback = vi.fn();

      new CookieStateStore().store(request({ minted: STATE }), callback);

      expect(callback).toHaveBeenCalledWith(null, STATE);
    });

    it('fails loudly when no state was prepared, rather than sending none', () => {
      const callback = vi.fn();

      new CookieStateStore().store(request(), callback);

      expect(callback.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(callback.mock.calls[0][1]).toBeUndefined();
    });
  });

  describe('verify', () => {
    it('accepts the value the browser was given', () => {
      const callback = vi.fn();

      new CookieStateStore().verify(
        request({ cookie: STATE }),
        STATE,
        callback,
      );

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    // Without this the callback would take any code that reached it, which is
    // what lets an attacker finish their own handshake in a victim's browser.
    it('refuses a state the browser was never given', () => {
      const callback = vi.fn();

      new CookieStateStore().verify(
        request({ cookie: STATE }),
        'forged-by-someone-else',
        callback,
      );

      expect(callback.mock.calls[0][1]).toBe(false);
    });

    it('refuses a callback carrying no state', () => {
      const callback = vi.fn();

      new CookieStateStore().verify(request({ cookie: STATE }), '', callback);

      expect(callback.mock.calls[0][1]).toBe(false);
    });

    it('refuses when the cookie is gone, expired or never set', () => {
      const callback = vi.fn();

      new CookieStateStore().verify(request(), STATE, callback);

      expect(callback.mock.calls[0][1]).toBe(false);
    });

    // timingSafeEqual throws on a length mismatch, so a short value has to be
    // turned away before it reaches the comparison.
    it('refuses a value of a different length without throwing', () => {
      const callback = vi.fn();

      expect(() =>
        new CookieStateStore().verify(
          request({ cookie: STATE }),
          'ab',
          callback,
        ),
      ).not.toThrow();
      expect(callback.mock.calls[0][1]).toBe(false);
    });
  });
});
