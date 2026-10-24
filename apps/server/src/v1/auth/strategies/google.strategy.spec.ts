import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedUser } from '@repo/types';
import type { Profile } from 'passport-google-oauth20';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth.service';
import { GoogleStrategy } from './google.strategy';

const USER = { id: 'abc', email: 'ada@example.com' } as AuthenticatedUser;

const CONFIG: Record<string, string> = {
  SERVER_URL: 'http://localhost:8000',
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
};

function profile(
  emails?: { value: string; verified?: boolean | string }[],
): Profile {
  return { id: 'google-123', emails } as unknown as Profile;
}

function build(config: Record<string, string> = CONFIG) {
  const authService = {
    findOrCreateGoogleUser: vi.fn().mockResolvedValue(USER),
  } as unknown as AuthService;

  const configService = {
    get: (key: string) => config[key],
  } as unknown as ConfigService;

  return {
    authService,
    strategy: new GoogleStrategy(authService, configService),
  };
}

const validate = (strategy: GoogleStrategy, p: Profile) =>
  strategy.validate('access', 'refresh', p);

describe('GoogleStrategy', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuses to start without the credentials it needs', () => {
    expect(() => build({ ...CONFIG, GOOGLE_CLIENT_ID: '' })).toThrow(
      /GOOGLE_CLIENT_ID/,
    );
  });

  it('resolves a verified profile to an account', async () => {
    const { strategy } = build();

    await expect(
      validate(strategy, profile([{ value: USER.email, verified: true }])),
    ).resolves.toBe(USER);
  });

  it('passes the google id and address through for linking', async () => {
    const { strategy, authService } = build();

    await validate(strategy, profile([{ value: USER.email, verified: true }]));

    expect(authService.findOrCreateGoogleUser).toHaveBeenCalledWith({
      googleId: 'google-123',
      email: USER.email,
      emailVerified: true,
    });
  });

  it('accepts the string form google sometimes sends', async () => {
    const { strategy } = build();

    await expect(
      validate(strategy, profile([{ value: USER.email, verified: 'true' }])),
    ).resolves.toBe(USER);
  });

  // The account is matched by email, so an address google has not checked would
  // let anyone who can add it to a google account walk into the croom account
  // holding it.
  it('refuses an address google has not verified', async () => {
    const { strategy, authService } = build();

    await expect(
      validate(strategy, profile([{ value: USER.email, verified: false }])),
    ).rejects.toThrow(UnauthorizedException);
    expect(authService.findOrCreateGoogleUser).not.toHaveBeenCalled();
  });

  it('refuses a profile whose verified flag is missing entirely', async () => {
    const { strategy } = build();

    await expect(
      validate(strategy, profile([{ value: USER.email }])),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('refuses a profile carrying no email at all', async () => {
    const { strategy } = build();

    await expect(validate(strategy, profile([]))).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(validate(strategy, profile())).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
