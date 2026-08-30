import { InternalServerErrorException } from '@nestjs/common';
import { AuthServiceOptions } from '@repo/enums';
import { User } from '@repo/schemas';
import { hash } from 'bcrypt';
import { Model } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserModel } from './user.model';

vi.mock('bcrypt', () => ({
  hash: vi.fn(async (value: string) => `hashed:${value}`),
}));

function build() {
  const collection = {
    create: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(null),
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
});
