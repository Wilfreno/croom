import { SetMetadata, applyDecorators } from '@nestjs/common';
import { Throttle, seconds } from '@nestjs/throttler';

export const RATE_LIMIT_OPTIONS = 'rate_limit:options';

/**
 * The single throttler `RateLimitGuard` drives. Every `@RateLimit()` route
 * overrides its limit and window, so the module-level entry is only a fallback.
 */
export const RATE_LIMIT_THROTTLER = 'default';

/**
 * Reads the value a route counts against. Return `undefined` to fall back to
 * the caller's IP.
 */
export type RateLimitSelector = (
  request: Record<string, any>,
) => string | undefined;

export interface RateLimitOptions {
  /** How many requests are allowed inside `window`. */
  limit: number;

  /** Length of the window, in seconds. */
  window: number;

  /**
   * What the limit is counted per. A dotted path is read off the request
   * (`'body.email'`, `'params.id'`, `'headers.x-api-key'`); an array of paths
   * is joined, so each combination gets its own budget; a function computes the
   * value itself. Defaults to the caller's IP, which is also the fallback
   * whenever the chosen value is missing from the request.
   */
  by?: string | string[] | RateLimitSelector;
}

/**
 * Caps how often a route may be called.
 *
 * Buckets are scoped per route, so two decorated endpoints never share a
 * budget, and the value in `by` splits the budget further.
 *
 * @example
 * // 100 requests an hour from any one IP
 * @RateLimit({ limit: 100, window: SECONDS_IN_HOUR })
 *
 * @example
 * // 3 an hour per email address, whatever IP is asking
 * @RateLimit({ limit: 3, window: SECONDS_IN_HOUR, by: 'body.email' })
 */
export const RateLimit = (options: RateLimitOptions) =>
  applyDecorators(
    SetMetadata(RATE_LIMIT_OPTIONS, options),
    Throttle({
      [RATE_LIMIT_THROTTLER]: {
        limit: options.limit,
        ttl: seconds(options.window),
      },
    }),
  );
