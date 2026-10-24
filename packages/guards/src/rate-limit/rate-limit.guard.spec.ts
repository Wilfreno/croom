import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerLimitDetail } from '@nestjs/throttler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RateLimitOptions } from './rate-limit.decorator';
import { RateLimitGuard } from './rate-limit.guard';

const context = {
  getHandler: () => () => undefined,
  getClass: () => class {},
} as unknown as ExecutionContext;

function build(options?: RateLimitOptions) {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(options),
  } as unknown as Reflector;

  const guard = new RateLimitGuard(
    { throttlers: [] } as never,
    {} as never,
    reflector,
  );

  return guard as RateLimitGuard & {
    getTracker(req: Record<string, unknown>, ctx?: ExecutionContext): Promise<string>;
    shouldSkip(ctx: ExecutionContext): Promise<boolean>;
    getErrorMessage(ctx: ExecutionContext, d: ThrottlerLimitDetail): Promise<string>;
  };
}

const limit = (by: RateLimitOptions['by']): RateLimitOptions => ({
  limit: 2,
  window: 60,
  by,
});

describe('RateLimitGuard', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('shouldSkip', () => {
    it('skips a route with no @RateLimit()', async () => {
      await expect(build(undefined).shouldSkip(context)).resolves.toBe(true);
    });

    it('does not skip a route that declares a limit', async () => {
      await expect(build(limit('body.email')).shouldSkip(context)).resolves.toBe(
        false,
      );
    });
  });

  describe('getTracker', () => {
    it('falls back to the IP when the route declares no selector', async () => {
      const guard = build(undefined);

      await expect(guard.getTracker({ ip: '1.2.3.4' }, context)).resolves.toBe(
        'ip:1.2.3.4',
      );
    });

    it('falls back to the IP when there is no context to read options from', async () => {
      const guard = build(limit('body.email'));

      await expect(guard.getTracker({ ip: '1.2.3.4' })).resolves.toBe('ip:1.2.3.4');
    });

    it('reads a dotted path off the request', async () => {
      const guard = build(limit('body.email'));

      await expect(
        guard.getTracker({ ip: '1.2.3.4', body: { email: 'a@b.com' } }, context),
      ).resolves.toBe('by:a@b.com');
    });

    it('lower-cases and trims so one caller cannot split their own budget', async () => {
      const guard = build(limit('body.email'));

      await expect(
        guard.getTracker({ ip: '1.2.3.4', body: { email: '  A@B.CoM  ' } }, context),
      ).resolves.toBe('by:a@b.com');
    });

    it('gives each combination of paths its own budget', async () => {
      const guard = build(limit(['body.email', 'params.type']));

      await expect(
        guard.getTracker(
          { ip: '1.2.3.4', body: { email: 'a@b.com' }, params: { type: 'SIGNUP' } },
          context,
        ),
      ).resolves.toBe('by:a@b.com|signup');
    });

    it('accepts a numeric value at the path', async () => {
      const guard = build(limit('body.id'));

      await expect(
        guard.getTracker({ ip: '1.2.3.4', body: { id: 42 } }, context),
      ).resolves.toBe('by:42');
    });

    it('runs a selector function when given one', async () => {
      const guard = build(limit((req) => String(req.headers['x-api-key'])));

      // note the bare value: unlike the dotted-path branch, a function selector
      // is not namespaced with `by:`, so its keys share a space with `ip:` ones
      await expect(
        guard.getTracker({ ip: '1.2.3.4', headers: { 'x-api-key': 'KEY-1' } }, context),
      ).resolves.toBe('key-1');
    });

    it('normalizes a selector result the same way as a path value', async () => {
      const guard = build(limit(() => '  MiXeD  '));

      await expect(guard.getTracker({ ip: '1.2.3.4' }, context)).resolves.toBe(
        'mixed',
      );
    });

    it('falls back to the IP when the selector returns nothing', async () => {
      const guard = build(limit(() => undefined));

      await expect(guard.getTracker({ ip: '1.2.3.4' }, context)).resolves.toBe(
        'ip:1.2.3.4',
      );
    });

    describe('falls back to the IP rather than merging callers', () => {
      // a missing part would collapse different callers onto one bucket, so a
      // caller could spend somebody else's budget
      it.each([
        ['the path is absent', { ip: '1.2.3.4', body: {} }],
        ['an intermediate object is missing', { ip: '1.2.3.4' }],
        ['the value is null', { ip: '1.2.3.4', body: { email: null } }],
        ['the value is an empty string', { ip: '1.2.3.4', body: { email: '' } }],
        ['the value is only whitespace', { ip: '1.2.3.4', body: { email: '   ' } }],
        ['the value is not a string', { ip: '1.2.3.4', body: { email: {} } }],
      ])('when %s', async (_case, req) => {
        const guard = build(limit('body.email'));

        await expect(guard.getTracker(req, context)).resolves.toBe('ip:1.2.3.4');
      });
    });

    it('falls back when only one of several paths resolves', async () => {
      const guard = build(limit(['body.email', 'params.type']));

      await expect(
        guard.getTracker({ ip: '1.2.3.4', body: { email: 'a@b.com' } }, context),
      ).resolves.toBe('ip:1.2.3.4');
    });
  });

  describe('getErrorMessage', () => {
    it.each([
      [30, 'too many requests, try again in 30s'],
      [90, 'too many requests, try again in 1m 30s'],
      [60, 'too many requests, try again in 1m 0s'],
    ])('phrases a %is wait', async (timeToExpire, expected) => {
      const guard = build(limit('body.email'));

      await expect(
        guard.getErrorMessage(context, { timeToExpire } as ThrottlerLimitDetail),
      ).resolves.toBe(expected);
    });

    it('rounds a part-second wait up', async () => {
      const guard = build(limit('body.email'));

      await expect(
        guard.getErrorMessage(context, { timeToExpire: 4.2 } as ThrottlerLimitDetail),
      ).resolves.toBe('too many requests, try again in 5s');
    });
  });
});
