import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { AuthenticatedUser } from '@repo/types';
import type { FastifyRequest } from 'fastify';

/**
 * The user `AuthGuard` resolved for this request.
 *
 * Always present on a protected route -- the guard throws before the handler
 * runs otherwise -- so handlers may take it as a plain `AuthenticatedUser`. On a
 * `@Public()` route it is undefined.
 *
 * @example
 * ＠Get('session')
 * session(＠CurrentUser() user: AuthenticatedUser) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthenticatedUser | undefined =>
    context.switchToHttp().getRequest<FastifyRequest>().user,
);
