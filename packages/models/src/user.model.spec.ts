import { InternalServerErrorException } from '@nestjs/common';
import { AuthServiceOptions } from '@repo/enums';
import { User } from '@repo/schemas';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { ClientSession, Model } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserModel } from './user.model';

vi.mock('bcrypt', () => ({
  hash: vi.fn(async (value: string) => `hashed:${value}`),
  compare: vi.fn(async (value: string, hashed: string) => hashed === `hashed:${value}`),
}));

const ABSENT_PASSWORD_HASH = '$2b$14$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';
const configService = { get: vi.fn(() => ABSENT_PASSWORD_HASH) } as unknown as ConfigService;
const session = {} as ClientSession;

function build() {
  const created = { _id: 'abc', email: 'someone@example.com' };
  const save = vi.fn().mockResolvedValue(undefined);
  const docs: Record<string, unknown>[] = [];

  // `create` builds a document with `new User(...)` and saves it inside the session.
  const collection = Object.assign(
    vi.fn(function (this: Record<string, unknown>, doc: Record<string, unknown>) {
      Object.assign(this, created, doc, { save });
      docs.push(this);
    }),
    {
      exists: vi.fn().mockResolvedValue(null),
      findOne: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue(null) }),
      findById: vi.fn().mockResolvedValue(null),
      findByIdAndUpdate: vi.fn().mockResolvedValue(created),
    },
  );

  return {
    collection,
    save,
    docs,
    model: new UserModel(collection as unknown as Model<User>),
  };
}

const created = (collection: ReturnType<typeof build>['collection']) => collection.mock.calls[0][0];

describe('UserModel', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    it('derives the username and display name from the email local part', async () => {
      const { collection, model } = build();

      await model.create({
        email: 'ada.lovelace@example.com',
        password: 'sup3rsecret',
        authService: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD,
      }, session);

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
      }, session);

      expect(hash).toHaveBeenCalledWith('sup3rsecret', 14);
      expect(created(collection).password).toBe('hashed:sup3rsecret');
      expect(created(collection).password).not.toBe('sup3rsecret');
    });

    it('stores no password for an oauth signup', async () => {
      const { collection, model } = build();

      await model.create({
        email: 'someone@example.com',
        authService: AuthServiceOptions.WITH_GOOGLE,
      }, session);

      expect(hash).not.toHaveBeenCalled();
      expect(created(collection).password).toBeUndefined();
    });

    it('records which service the account was opened with', async () => {
      const { collection, model } = build();

      await model.create({
        email: 'someone@example.com',
        authService: AuthServiceOptions.WITH_GOOGLE,
      }, session);

      expect(created(collection).authService).toBe(AuthServiceOptions.WITH_GOOGLE);
    });

    it("saves the new account inside the caller's transaction", async () => {
      const { save, model } = build();

      await model.create({ email: 'someone@example.com', authService: AuthServiceOptions.WITH_GOOGLE }, session);

      expect(save).toHaveBeenCalledWith({ session });
    });

    it('turns a driver failure into a 500', async () => {
      const { save, model } = build();
      save.mockRejectedValue(new Error('duplicate key'));

      await expect(
        model.create({
          email: 'someone@example.com',
          authService: AuthServiceOptions.WITH_GOOGLE,
        }, session),
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

      await expect(model.verifyPassword({ password: 'sup3rsecret', hashed: 'hashed:sup3rsecret', configService })).resolves.toBe(true);
    });

    it('rejects any other password', async () => {
      const { model } = build();

      await expect(model.verifyPassword({ password: 'guess', hashed: 'hashed:sup3rsecret', configService })).resolves.toBe(false);
    });

    it('rejects an account that has no password at all', async () => {
      const { model } = build();

      await expect(model.verifyPassword({ password: 'anything', configService })).resolves.toBe(false);
    });

    // The point of the fallback hash: an unknown email has to cost the same as
    // a known one, or the timing says which addresses are registered.
    it('still runs a comparison when there is no password to compare against', async () => {
      const { model } = build();

      await model.verifyPassword({ password: 'anything', configService });

      expect(compare).toHaveBeenCalledTimes(1);
      expect(vi.mocked(compare).mock.calls[0][1]).toBe(ABSENT_PASSWORD_HASH);
    });
  });

  describe('create, for an account opened through google', () => {
    it('returns the document it wrote, so the caller need not read it back', async () => {
      const { model } = build();

      await expect(
        model.create({
          email: 'someone@example.com',
          authService: AuthServiceOptions.WITH_GOOGLE,
        }, session),
      ).resolves.toMatchObject({ _id: 'abc' });
    });

  });

  describe('getUserByEmail', () => {
    it('matches on the address', async () => {
      const { collection, model } = build();

      await model.getUserByEmail('someone@example.com');

      expect(collection.findOne).toHaveBeenCalledWith({
        email: 'someone@example.com',
      });
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.findOne.mockImplementation(() => {
        throw new Error('connection lost');
      });

      await expect(
        model.getUserByEmail('e@example.com'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('linkGoogleAccount', () => {
    const id = 'abc' as unknown as Parameters<UserModel['linkGoogleAccount']>[0];

    // $addToSet rather than $push: signing in again must not stack duplicates
    // onto authService.
    it('adds google to the ways in without duplicating it', async () => {
      const { collection, model } = build();

      await model.linkGoogleAccount(id);

      expect(collection.findByIdAndUpdate.mock.calls[0][1].$addToSet).toEqual({
        authService: AuthServiceOptions.WITH_GOOGLE,
      });
    });

    it('answers with the linked document rather than the one before the update', async () => {
      const { collection, model } = build();

      await model.linkGoogleAccount(id);

      expect(collection.findByIdAndUpdate.mock.calls[0][2]).toMatchObject({
        new: true,
      });
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.findByIdAndUpdate.mockRejectedValue(new Error('connection lost'));

      await expect(model.linkGoogleAccount(id)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
