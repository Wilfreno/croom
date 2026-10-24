import type { User } from '@repo/schemas';

/**
 * The user hung off every authenticated request, and the body of
 * `GET /v1/auth/session`. Carries `id` rather than `_id` because that is what
 * the client reads, and never carries the password hash.
 */
export type AuthenticatedUser = Omit<User, 'password'> & { id: string };
