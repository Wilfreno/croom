import { UnauthorizedException } from '@nestjs/common';
import { INVALID_CREDENTIALS } from '@repo/constants';
import type { AuthenticatedUser } from '@repo/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth.service';
import { LocalStrategy } from './local.strategy';

const USER = { id: 'abc', email: 'ada@example.com' } as AuthenticatedUser;

function build(user: AuthenticatedUser | null = USER) {
  const authService = {
    validateCredentials: vi.fn().mockResolvedValue(user),
  } as unknown as AuthService;

  return { authService, strategy: new LocalStrategy(authService) };
}

describe('LocalStrategy', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the user when the credentials check out', async () => {
    const { strategy } = build();

    await expect(strategy.validate(USER.email, 'sup3rsecret')).resolves.toBe(
      USER,
    );
  });

  it('passes the credentials through as an email and password', async () => {
    const { strategy, authService } = build();

    await strategy.validate(USER.email, 'sup3rsecret');

    expect(authService.validateCredentials).toHaveBeenCalledWith({
      email: USER.email,
      password: 'sup3rsecret',
    });
  });

  it('rejects when the service returns nobody', async () => {
    const { strategy } = build(null);

    await expect(strategy.validate(USER.email, 'wrong')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // The service already refuses to say which half was wrong; the strategy has
  // to keep it that way when it turns the null into a message.
  it('names neither the email nor the password in the rejection', async () => {
    const { strategy } = build(null);

    await expect(strategy.validate(USER.email, 'wrong')).rejects.toThrow(
      INVALID_CREDENTIALS,
    );
  });
});
