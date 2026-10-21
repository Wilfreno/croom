import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_PUBLIC_KEY, SESSION_COOKIE } from '@repo/constants';
import type { AuthenticatedUser } from '@repo/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionGuard } from './session.guard';
import { AuthService } from './auth.service';

const USER = { id: 'abc', email: 'ada@example.com' } as AuthenticatedUser;

function contextFor(cookies: Record<string, string | undefined> = {}) {
  const request: Record<string, unknown> = { cookies };

  return {
    request,
    context: {
      getHandler: () => vi.fn(),
      getClass: () => class {},
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext,
  };
}

function build({
  isPublic = false,
  user = USER as AuthenticatedUser | null,
} = {}) {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(isPublic || undefined),
  } as unknown as Reflector;
  const authService = {
    resolveSession: vi.fn().mockResolvedValue(user),
  } as unknown as AuthService;

  return {
    reflector,
    authService,
    guard: new SessionGuard(reflector, authService),
  };
}

describe('SessionGuard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lets a session through and hangs the user on the request', async () => {
    const { guard } = build();
    const { request, context } = contextFor({ [SESSION_COOKIE]: 'a-token' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBe(USER);
  });

  it('turns away a request with no cookie', async () => {
    const { guard } = build();
    const { context } = contextFor();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('turns away a cookie whose session is gone or expired', async () => {
    const { guard } = build({ user: null });
    const { context } = contextFor({ [SESSION_COOKIE]: 'a-token' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('leaves no user on the request it turned away', async () => {
    const { guard } = build({ user: null });
    const { request, context } = contextFor({ [SESSION_COOKIE]: 'a-token' });

    await guard.canActivate(context).catch(() => undefined);

    expect(request.user).toBeUndefined();
  });

  describe('@Public()', () => {
    it('lets an anonymous caller through', async () => {
      const { guard } = build({ isPublic: true });
      const { context } = contextFor();

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('does not spend a session lookup on the route', async () => {
      const { guard, authService } = build({ isPublic: true });
      const { context } = contextFor({ [SESSION_COOKIE]: 'a-token' });

      await guard.canActivate(context);

      expect(authService.resolveSession).not.toHaveBeenCalled();
    });

    it('reads the flag off both the handler and its controller', async () => {
      const { guard, reflector } = build({ isPublic: true });
      const { context } = contextFor();

      await guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        AUTH_PUBLIC_KEY,
        [expect.anything(), expect.anything()],
      );
    });
  });

  // The whole point of registering this as an APP_GUARD: a route that says
  // nothing at all is protected, not open.
  it('defaults to denying a route that carries no decorator', async () => {
    const { guard } = build({ isPublic: false });
    const { context } = contextFor();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
