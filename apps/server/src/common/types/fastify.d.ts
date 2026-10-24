import type { AuthenticatedUser } from '@repo/types';
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    /**
     * Set by `AuthGuard` before the handler runs. Present on every route that
     * is not `@Public()`; read it through `@CurrentUser()` rather than here.
     */
    user?: AuthenticatedUser;
  }
}
