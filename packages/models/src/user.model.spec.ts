import { InternalServerErrorException } from '@nestjs/common';
import { AuthServiceOptions } from '@repo/enums';
import { User } from '@repo/schemas';
import { compare, hash } from 'bcrypt';
import { Model } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserModel } from './user.model';

vi.mock('bcrypt', () => ({
  hash: vi.fn(async (value: string) => `hashed:${value}`),
  compare: vi.fn(async (value: string, hashed: string) => hashed === `hashed:${value}`),
}));

function build() {
  const created = { _id: 'abc', email: 'someone@example.com' };

  const collection = {
    // `create` is handed an array and answers with one, which the model
    // destructures to return the document it just wrote.
    create: vi.fn().mockResolvedValue([created]),
    exists: vi.fn().mockResolvedValue(null),
    findOne: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue(null) }),
    findById: vi.fn().mockResolvedValue(null),
    findByIdAndUpdate: vi.fn().mockResolvedValue(created),
  };

  return {
    collection,
    model: new UserModel(collection as unknown as Model<User>),
  };
}

const created = (collection: { create: ReturnType<typeof vi.fn> }) =>
  collection.create.mock.calls[0][0][0];

describe('UserModel', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    it('derives the username and display name from the email local part', async () => {
      const { collection, model } = build();

      await model.create({
        email: 'ada.lovelace@example.com',
        password: 'sup3rsecret',
        authService: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD,
      });

      expect(created(collection)).toMatchObject({
        email: 'ada.lovelace@example.com',
        userName: 'ada.lovelace',
        displayName: 'ada.lovelace',
      });
    });

    it('hashes the password rather than storing it as given', async () => {
      const { collection, model } = build();

      await model.create({
        email: 'someone@example.com',
        password: 'sup3rsecret',
        authService: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD,
      });

      expect(hash).toHaveBeenCalledWith('sup3rsecret', 10);
      expect(created(collection).password).toBe('hashed:sup3rsecret');
      expect(created(collection).password).not.toBe('sup3rsecret');
    });

    it('stores no password for an oauth signup', async () => {
      const { collection, model } = build();

      await model.create({
        email: 'someone@example.com',
        authService: AuthServiceOptions.WITH_GOOGLE,
      });

      expect(hash).not.toHaveBeenCalled();
      expect(created(collection).password).toBeUndefined();
    });

    it('records which service the account was opened with', async () => {
      const { collection, model } = build();

      await model.create({
        email: 'someone@example.com',
        authService: AuthServiceOptions.WITH_GOOGLE,
      });

      expect(created(collection).authService).toBe(AuthServiceOptions.WITH_GOOGLE);
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.create.mockRejectedValue(new Error('duplicate key'));

      await expect(
        model.create({
          email: 'someone@example.com',
          authService: AuthServiceOptions.WITH_GOOGLE,
        }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('getUserExistByEmail', () => {
    it('is false when no account matches', async () => {
      const { model } = build();

      await expect(model.getUserExistByEmail('someone@example.com')).resolves.toBe(
        false,
      );
    });

    it('is true when an account matches', async () => {
      const { collection, model } = build();
      collection.exists.mockResolvedValue({ _id: 'abc' });

      await expect(model.getUserExistByEmail('someone@example.com')).resolves.toBe(
        true,
      );
    });

    it('queries the email field', async () => {
      const { collection, model } = build();

      await model.getUserExistByEmail('someone@example.com');

      expect(collection.exists).toHaveBeenCalledWith({
        email: 'someone@example.com',
      });
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.exists.mockRejectedValue(new Error('connection lost'));

      await expect(
        model.getUserExistByEmail('someone@example.com'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('getUserExistByUsername', () => {
    it('is true when an account matches', async () => {
      const { collection, model } = build();
      collection.exists.mockResolvedValue({ _id: 'abc' });

      await expect(model.getUserExistByUsername('ada')).resolves.toBe(true);
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.exists.mockRejectedValue(new Error('connection lost'));

      await expect(model.getUserExistByUsername('ada')).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    // Skipped rather than pinned to today's behavior: this queries `username`,
    // but the User schema declares the field as `userName`, so the filter
    // matches no document and every username reads as available. Left for a
    // decision because the legacy fastify app writes `username` into the same
    // database -- the fix may be a data migration, not just a renamed key.
    it.skip('queries the userName field the schema declares', async () => {
      const { collection, model } = build();

      await model.getUserExistByUsername('ada');

      expect(collection.exists).toHaveBeenCalledWith({ userName: 'ada' });
    });
  });

  describe('getUserByEmailWithPassword', () => {
    it('asks for the password the schema otherwise withholds', async () => {
      const { collection, model } = build();
      const select = vi.fn().mockResolvedValue(null);
      collection.findOne.mockReturnValue({ select });

      await model.getUserByEmailWithPassword('someone@example.com');

      expect(collection.findOne).toHaveBeenCalledWith({ email: 'someone@example.com' });
      expect(select).toHaveBeenCalledWith('+password');
    });

    it('is null when no account matches', async () => {
      const { model } = build();

      await expect(model.getUserByEmailWithPassword('someone@example.com')).resolves.toBeNull();
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.findOne.mockImplementation(() => {
        throw new Error('connection lost');
      });

      await expect(model.getUserByEmailWithPassword('someone@example.com')).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('getUserById', () => {
    it('reads the account by id', async () => {
      const { collection, model } = build();

      await model.getUserById('507f1f77bcf86cd799439011');

      expect(collection.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('does not ask for the password', async () => {
      const { collection, model } = build();

      await model.getUserById('507f1f77bcf86cd799439011');

      expect(JSON.stringify(collection.findById.mock.calls)).not.toContain('password');
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.findById.mockRejectedValue(new Error('connection lost'));

      await expect(model.getUserById('507f1f77bcf86cd799439011')).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('verifyPassword', () => {
    it('accepts the password behind the hash', async () => {
      const { model } = build();

      await expect(model.verifyPassword('sup3rsecret', 'hashed:sup3rsecret')).resolves.toBe(true);
    });

    it('rejects any other password', async () => {
      const { model } = build();

      await expect(model.verifyPassword('guess', 'hashed:sup3rsecret')).resolves.toBe(false);
    });

    it('rejects an account that has no password at all', async () => {
      const { model } = build();

      await expect(model.verifyPassword('anything', undefined)).resolves.toBe(false);
    });

    // The point of the fallback hash: an unknown email has to cost the same as
    // a known one, or the timing says which addresses are registered.
    it('still runs a comparison when there is no password to compare against', async () => {
      const { model } = build();

      await model.verifyPassword('anything', undefined);

      expect(compare).toHaveBeenCalledTimes(1);
      expect(vi.mocked(compare).mock.calls[0][1]).toMatch(/^\$2b\$/);
    });
  });

  describe('create, for an account opened through google', () => {
    it('returns the document it wrote, so the caller need not read it back', async () => {
      const { model } = build();

      await expect(
        model.create({
          email: 'someone@example.com',
          googleId: 'google-123',
          authService: AuthServiceOptions.WITH_GOOGLE,
        }),
      ).resolves.toMatchObject({ _id: 'abc' });
    });

    it('stores the google id and marks the address verified', async () => {
      const { collection, model } = build();

      await model.create({
        email: 'someone@example.com',
        googleId: 'google-123',
        emailVerified: true,
        authService: AuthServiceOptions.WITH_GOOGLE,
      });

      expect(created(collection)).toMatchObject({
        googleId: 'google-123',
        emailVerified: true,
      });
    });

    it('leaves the address unverified when nothing vouched for it', async () => {
      const { collection, model } = build();

      await model.create({
        email: 'someone@example.com',
        password: 'sup3rsecret',
        authService: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD,
      });

      expect(created(collection).emailVerified).toBe(false);
    });
  });

  describe('getUserByGoogleIdOrEmail', () => {
    it('matches on either the google id or the address', async () => {
      const { collection, model } = build();

      await model.getUserByGoogleIdOrEmail({
        googleId: 'google-123',
        email: 'someone@example.com',
      });

      expect(collection.findOne).toHaveBeenCalledWith({
        $or: [{ googleId: 'google-123' }, { email: 'someone@example.com' }],
      });
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.findOne.mockImplementation(() => {
        throw new Error('connection lost');
      });

      await expect(
        model.getUserByGoogleIdOrEmail({ googleId: 'g', email: 'e@example.com' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('linkGoogleAccount', () => {
    const id = 'abc' as unknown as Parameters<UserModel['linkGoogleAccount']>[0];

    it('stores the google id and trusts the address from then on', async () => {
      const { collection, model } = build();

      await model.linkGoogleAccount(id, 'google-123');

      expect(collection.findByIdAndUpdate.mock.calls[0][1].$set).toMatchObject({
        googleId: 'google-123',
        emailVerified: true,
      });
    });

    // $addToSet rather than $push: signing in again must not stack duplicates
    // onto authService.
    it('adds google to the ways in without duplicating it', async () => {
      const { collection, model } = build();

      await model.linkGoogleAccount(id, 'google-123');

      expect(collection.findByIdAndUpdate.mock.calls[0][1].$addToSet).toEqual({
        authService: AuthServiceOptions.WITH_GOOGLE,
      });
    });

    it('answers with the linked document rather than the one before the update', async () => {
      const { collection, model } = build();

      await model.linkGoogleAccount(id, 'google-123');

      expect(collection.findByIdAndUpdate.mock.calls[0][2]).toMatchObject({
        new: true,
      });
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.findByIdAndUpdate.mockRejectedValue(new Error('connection lost'));

      await expect(model.linkGoogleAccount(id, 'google-123')).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
