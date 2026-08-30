import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { secondsToMinuteAndSeconds } from '@repo/utils';
import { RATE_LIMIT_OPTIONS, RateLimitOptions } from './rate-limit.decorator';

/** Walks a dotted path such as `body.email` off the request. */
function readPath(request: Record<string, any>, path: string): unknown {
  return path.split('.').reduce<any>((value, key) => (value == null ? undefined : value[key]), request);
}

function toTrackerPart(value: unknown): string | undefined {
  if (typeof value === 'number') return String(value);
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim().toLowerCase();

  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Enforces the caps declared by `@RateLimit()`. Register it once as an
 * `APP_GUARD`; routes without the decorator are skipped, so adding a limit
 * anywhere else in the app is a one-line change.
 *
 * Counters live in memory, so they reset on restart and are not shared between
 * instances. Anything that must survive both needs a durable check of its own
 * alongside this.
 */
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    return !this.readOptions(context);
  }

  /**
   * `context` is always supplied by `ThrottlerGuard`, but the base signature
   * declares only `req`, so it stays optional here to remain assignable.
   */
  protected async getTracker(req: Record<string, any>, context?: ExecutionContext): Promise<string> {
    const by = context ? this.readOptions(context)?.by : undefined;

    if (!by) return `ip:${req.ip}`;

    if (typeof by === 'function') return toTrackerPart(by(req)) ?? `ip:${req.ip}`;

    const paths = Array.isArray(by) ? by : [by];
    const parts = paths.map((path) => toTrackerPart(readPath(req, path)));

    // one missing part would collapse different callers onto a shared bucket,
    // so fall back to the IP rather than count them together
    if (parts.some((part) => part === undefined)) return `ip:${req.ip}`;

    return `by:${parts.join('|')}`;
  }

  protected async getErrorMessage(
    _context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<string> {
    const retryIn = Math.ceil(throttlerLimitDetail.timeToExpire);
    const { minute, seconds } = secondsToMinuteAndSeconds(retryIn);

    return `too many requests, try again in${minute ? ` ${minute}m` : ''} ${seconds}s`;
  }

  private readOptions(context: ExecutionContext): RateLimitOptions | undefined {
    return this.reflector.getAllAndOverride<RateLimitOptions | undefined>(RATE_LIMIT_OPTIONS, [
      context.getHandler(),
      context.getClass(),
    ]);
  }
}
