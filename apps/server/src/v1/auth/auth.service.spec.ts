import { Test } from '@nestjs/testing';
import { AuthServiceOptions, UserStatus } from '@repo/enums';
import { SessionModel, UserModel } from '@repo/models';
import type { AuthenticatedUser } from '@repo/types';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

const USER_ID = new Types.ObjectId();
const CREDENTIALS = { email: 'ada@example.com', password: 'sup3rsecret' };
const PROFILE = {
  googleId: 'google-123',
  email: CREDENTIALS.email,
  emailVerified: true,
};

/** A stand-in for what mongoose hands back, `toObject` and all. */
function userDocument(overrides: Record<string, unknown> = {}) {
  const plain = {
    _id: USER_ID,
    __v: 0,
    email: CREDENTIALS.email,
    userName: 'ada',
    displayName: 'ada',
    password: 'hashed:sup3rsecret',
    status: UserStatus.OFFLINE,
    authService: [AuthServiceOptions.WITH_EMAIL_AND_PASSWORD],
    ...overrides,
  };

  return { ...plain, toObject: () => plain };
}

function build() {
  const userModel = {
    getUserByEmailWithPassword: vi.fn().mockResolvedValue(userDocument()),
    getUserById: vi.fn().mockResolvedValue(userDocument()),
    getUserByGoogleIdOrEmail: vi.fn().mockResolvedValue(userDocument()),
    linkGoogleAccount: vi.fn().mockResolvedValue(userDocument()),
    create: vi.fn().mockResolvedValue(userDocument()),
    verifyPassword: vi.fn().mockResolvedValue(true),
  };
  const sessionModel = {
    create: vi.fn().mockResolvedValue('a-token'),
    getUserIdByToken: vi.fn().mockResolvedValue(USER_ID),
    revoke: vi.fn().mockResolvedValue(undefined),
  };

  return { userModel, sessionModel };
}

type Mocks = ReturnType<typeof build>;

async function makeService(mocks: Mocks) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: UserModel, useValue: mocks.userModel },
      { provide: SessionModel, useValue: mocks.sessionModel },
    ],
  }).compile();

  return moduleRef.get(AuthService);
}

const asUser = (id: Types.ObjectId) =>
  ({ id: String(id) }) as AuthenticatedUser;

describe('AuthService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('validateCredentials', () => {
    it('returns the user behind a right password', async () => {
      const service = await makeService(build());

      await expect(
        service.validateCredentials(CREDENTIALS),
      ).resolves.toMatchObject({
        id: String(USER_ID),
        email: CREDENTIALS.email,
      });
    });

    it('returns null for a wrong password', async () => {
      const mocks = build();
      mocks.userModel.verifyPassword.mockResolvedValue(false);

      await expect(
        (await makeService(mocks)).validateCredentials(CREDENTIALS),
      ).resolves.toBeNull();
    });

    it('returns null for an email with no account', async () => {
      const mocks = build();
      mocks.userModel.getUserByEmailWithPassword.mockResolvedValue(null);
      mocks.userModel.verifyPassword.mockResolvedValue(false);

      await expect(
        (await makeService(mocks)).validateCredentials(CREDENTIALS),
      ).resolves.toBeNull();
    });

    // Both failures answer the same way, so the route cannot be used to find
    // out which addresses have accounts. LocalStrategy turns the null into the
    // one shared message.
    it('does not distinguish a missing account from a wrong password', async () => {
      const wrongPassword = build();
      wrongPassword.userModel.verifyPassword.mockResolvedValue(false);

      const noAccount = build();
      noAccount.userModel.getUserByEmailWithPassword.mockResolvedValue(null);
      noAccount.userModel.verifyPassword.mockResolvedValue(false);

      const results = await Promise.all(
        [wrongPassword, noAccount].map(async (mocks) =>
          (await makeService(mocks)).validateCredentials(CREDENTIALS),
        ),
      );

      expect(results).toEqual([null, null]);
    });

    it('compares a password even when the email matched nothing, so the two cost the same', async () => {
      const mocks = build();
      mocks.userModel.getUserByEmailWithPassword.mockResolvedValue(null);
      mocks.userModel.verifyPassword.mockResolvedValue(false);

      await (await makeService(mocks)).validateCredentials(CREDENTIALS);

      expect(mocks.userModel.verifyPassword).toHaveBeenCalledWith(
        CREDENTIALS.password,
        undefined,
      );
    });

    // A strategy decides who the caller is and stops there; the route is what
    // opens the session. Keeping the two apart is what lets google reuse it.
    it('opens no session of its own', async () => {
      const mocks = build();

      await (await makeService(mocks)).validateCredentials(CREDENTIALS);

      expect(mocks.sessionModel.create).not.toHaveBeenCalled();
    });

    it('returns the user as id rather than _id, with no password on it', async () => {
      const user = await (
        await makeService(build())
      ).validateCredentials(CREDENTIALS);

      expect(user).toMatchObject({
        id: String(USER_ID),
        email: CREDENTIALS.email,
      });
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('_id');
      expect(user).not.toHaveProperty('__v');
    });
  });

  describe('issueSession', () => {
    it('opens a session for an already-identified user', async () => {
      const mocks = build();

      const token = await (
        await makeService(mocks)
      ).issueSession(asUser(USER_ID));

      expect(mocks.sessionModel.create).toHaveBeenCalledWith(USER_ID, {});
      expect(token).toBe('a-token');
    });

    it('records the browser the session was opened from', async () => {
      const mocks = build();

      await (
        await makeService(mocks)
      ).issueSession(asUser(USER_ID), {
        ip: '203.0.113.4',
        userAgent: 'Firefox',
      });

      expect(mocks.sessionModel.create).toHaveBeenCalledWith(USER_ID, {
        ip: '203.0.113.4',
        userAgent: 'Firefox',
      });
    });
  });

  describe('findOrCreateGoogleUser', () => {
    it('opens an account the first time an address arrives', async () => {
      const mocks = build();
      mocks.userModel.getUserByGoogleIdOrEmail.mockResolvedValue(null);

      await (await makeService(mocks)).findOrCreateGoogleUser(PROFILE);

      expect(mocks.userModel.create).toHaveBeenCalledWith({
        email: PROFILE.email,
        googleId: PROFILE.googleId,
        authService: AuthServiceOptions.WITH_GOOGLE,
      });
    });

    it('stores no password for an account opened through google', async () => {
      const mocks = build();
      mocks.userModel.getUserByGoogleIdOrEmail.mockResolvedValue(null);

      await (await makeService(mocks)).findOrCreateGoogleUser(PROFILE);

      expect(mocks.userModel.create.mock.calls[0][0]).not.toHaveProperty(
        'password',
      );
    });

    // Signing in with google onto an account opened with a password is the
    // linking case: same person, second way in, not a second account.
    it('links google onto an account that already holds the address', async () => {
      const mocks = build();

      await (await makeService(mocks)).findOrCreateGoogleUser(PROFILE);

      expect(mocks.userModel.create).not.toHaveBeenCalled();
      expect(mocks.userModel.linkGoogleAccount).toHaveBeenCalledWith(
        USER_ID,
        PROFILE.googleId,
      );
    });

    it('returns the linked user rather than the copy read before linking', async () => {
      const mocks = build();
      mocks.userModel.linkGoogleAccount.mockResolvedValue(
        userDocument({ displayName: 'linked' }),
      );

      await expect(
        (await makeService(mocks)).findOrCreateGoogleUser(PROFILE),
      ).resolves.toMatchObject({ displayName: 'linked' });
    });

    it('falls back to the user it found when the link returns nothing', async () => {
      const mocks = build();
      mocks.userModel.linkGoogleAccount.mockResolvedValue(null);

      await expect(
        (await makeService(mocks)).findOrCreateGoogleUser(PROFILE),
      ).resolves.toMatchObject({ id: String(USER_ID) });
    });

    it('never lets the password out', async () => {
      await expect(
        (await makeService(build())).findOrCreateGoogleUser(PROFILE),
      ).resolves.not.toHaveProperty('password');
    });
  });

  describe('resolveSession', () => {
    it('returns the user behind a live token', async () => {
      await expect(
        (await makeService(build())).resolveSession('a-token'),
      ).resolves.toMatchObject({ id: String(USER_ID) });
    });

    it('never lets the password out', async () => {
      await expect(
        (await makeService(build())).resolveSession('a-token'),
      ).resolves.not.toHaveProperty('password');
    });

    it('is null for a token that matches no session', async () => {
      const mocks = build();
      mocks.sessionModel.getUserIdByToken.mockResolvedValue(null);

      await expect(
        (await makeService(mocks)).resolveSession('a-token'),
      ).resolves.toBeNull();
      expect(mocks.userModel.getUserById).not.toHaveBeenCalled();
    });

    it('is null when the session outlived the account', async () => {
      const mocks = build();
      mocks.userModel.getUserById.mockResolvedValue(null);

      await expect(
        (await makeService(mocks)).resolveSession('a-token'),
      ).resolves.toBeNull();
    });

    it('drops a session whose account is gone rather than looking it up again next request', async () => {
      const mocks = build();
      mocks.userModel.getUserById.mockResolvedValue(null);

      await (await makeService(mocks)).resolveSession('a-token');

      expect(mocks.sessionModel.revoke).toHaveBeenCalledWith('a-token');
    });
  });

  describe('logout', () => {
    it('revokes the session behind the token', async () => {
      const mocks = build();

      await (await makeService(mocks)).logout('a-token');

      expect(mocks.sessionModel.revoke).toHaveBeenCalledWith('a-token');
    });
  });
});
