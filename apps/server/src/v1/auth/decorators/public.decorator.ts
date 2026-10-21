import { SetMetadata } from '@nestjs/common';
import { AUTH_PUBLIC_KEY } from '@repo/constants';

/**
 * Opens a route to callers with no session. `AuthGuard` runs on everything, so
 * this is the only way past it -- new routes are protected until someone says
 * otherwise, and the mistake you can make is exposing a route on purpose rather
 * than forgetting to protect one.
 *
 * Works on a single handler or a whole controller.
 */
export const Public = () => SetMetadata(AUTH_PUBLIC_KEY, true);
