import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, seconds } from '@nestjs/throttler';
import { RATE_LIMIT_THROTTLER } from './rate-limit.decorator';
import { RateLimitGuard } from './rate-limit.guard';

/**
 * Import once in the root module to make `@RateLimit()` usable on any route.
 * Undecorated routes are left alone.
 */
@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        // only a fallback -- every @RateLimit() route overrides both values
        { name: RATE_LIMIT_THROTTLER, limit: 60, ttl: seconds(60) },
      ],
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class RateLimitModule {}
