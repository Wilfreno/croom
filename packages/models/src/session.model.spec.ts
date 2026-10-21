import { InternalServerErrorException } from '@nestjs/common';
import { SESSION_LIFETIME_SECONDS, SESSION_TOKEN_BYTES } from '@repo/constants';
import { Session } from '@repo/schemas';
import { createHash } from 'crypto';
import { Model, Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionModel, hashSessionToken } from './session.model';

const USER = new Types.ObjectId();

function build(overrides: Partial<Record<string, unknown>> = {}) {
  const collection = {
    create: vi.fn().mockResolvedValue(undefined),
    findOne: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    deleteOne: vi.fn().mockResolvedValue(undefined),
    deleteMany: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return {
    collection,
    model: new SessionModel(collection as unknown as Model<Session>),
  };
}

/** What a findOne().lean() should hand back for a session created `ageInSeconds` ago. */
function stored(ageInSeconds: number) {
  return {
    lean: vi.fn().mockResolvedValue({
      user: USER,
      dateCreated: new Date(Date.now() - ageInSeconds * 1000),
    }),
  };
}

const created = (collection: { create: ReturnType<typeof vi.fn> }) => collection.create.mock.calls[0][0][0];

describe('hashSessionToken', () => {
  it('is the sha-256 of the token', () => {
    expect(hashSessionToken('token')).toBe(createHash('sha256').update('token').digest('hex'));
  });

  it('gives the same digest for the same token', () => {
    expect(hashSessionToken('token')).toBe(hashSessionToken('token'));
    expect(hashSessionToken('token')).not.toBe(hashSessionToken('other'));
  });
});

describe('SessionModel', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    it('returns a token of the configured entropy, hex encoded', async () => {
      const { model } = build();

      const token = await model.create(USER);

      expect(token).toHaveLength(SESSION_TOKEN_BYTES * 2);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('never gives the same token twice', async () => {
      const { model } = build();

      const [first, second] = [await model.create(USER), await model.create(USER)];

      expect(first).not.toBe(second);
    });

    it('stores the digest of the token rather than the token', async () => {
      const { collection, model } = build();

      const token = await model.create(USER);

      expect(created(collection).hashedToken).toBe(hashSessionToken(token));
      expect(JSON.stringify(created(collection))).not.toContain(token);
    });

    it('records the browser the session was opened from', async () => {
      const { collection, model } = build();

      await model.create(USER, { ip: '203.0.113.4', userAgent: 'Firefox' });

      expect(created(collection)).toMatchObject({
        user: USER,
        ip: '203.0.113.4',
        userAgent: 'Firefox',
      });
    });

    it('reports a driver failure as a server error', async () => {
      const { model } = build({ create: vi.fn().mockRejectedValue(new Error('mongo is down')) });

      await expect(model.create(USER)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getUserIdByToken', () => {
    it('looks the session up by digest, never by the raw token', async () => {
      const { collection, model } = build({ findOne: vi.fn().mockReturnValue(stored(0)) });

      await model.getUserIdByToken('a-token');

      expect(collection.findOne).toHaveBeenCalledWith({ hashedToken: hashSessionToken('a-token') }, expect.anything());
    });

    it('returns the owner of a live session', async () => {
      const { model } = build({ findOne: vi.fn().mockReturnValue(stored(60)) });

      await expect(model.getUserIdByToken('a-token')).resolves.toBe(USER);
    });

    it('returns null for a token that matches nothing', async () => {
      const { model } = build();

      await expect(model.getUserIdByToken('a-token')).resolves.toBeNull();
    });

    it('rejects a session older than its lifetime even though the row is still there', async () => {
      const { model } = build({ findOne: vi.fn().mockReturnValue(stored(SESSION_LIFETIME_SECONDS + 1)) });

      await expect(model.getUserIdByToken('a-token')).resolves.toBeNull();
    });

    it('deletes the row it found expired, rather than leaving it for the ttl sweep', async () => {
      const { collection, model } = build({ findOne: vi.fn().mockReturnValue(stored(SESSION_LIFETIME_SECONDS + 1)) });

      await model.getUserIdByToken('a-token');

      expect(collection.deleteOne).toHaveBeenCalledWith({ hashedToken: hashSessionToken('a-token') });
    });

    it('reports a driver failure as a server error', async () => {
      const { model } = build({ findOne: vi.fn().mockImplementation(() => { throw new Error('mongo is down'); }) });

      await expect(model.getUserIdByToken('a-token')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('revoke', () => {
    it('deletes the session behind the token', async () => {
      const { collection, model } = build();

      await model.revoke('a-token');

      expect(collection.deleteOne).toHaveBeenCalledWith({ hashedToken: hashSessionToken('a-token') });
    });

    it('is silent when the token matches nothing', async () => {
      const { model } = build({ deleteOne: vi.fn().mockResolvedValue({ deletedCount: 0 }) });

      await expect(model.revoke('a-token')).resolves.toBeUndefined();
    });
  });

  describe('revokeAllForUser', () => {
    it('deletes every session the user owns', async () => {
      const { collection, model } = build();

      await model.revokeAllForUser(USER);

      expect(collection.deleteMany).toHaveBeenCalledWith({ user: USER }, { session: undefined });
    });

    it('spares the session doing the revoking when one is named', async () => {
      const { collection, model } = build();

      await model.revokeAllForUser(USER, { except: 'a-token' });

      expect(collection.deleteMany).toHaveBeenCalledWith(
        { user: USER, hashedToken: { $ne: hashSessionToken('a-token') } },
        { session: undefined },
      );
    });

    it('reports a driver failure as a server error', async () => {
      const { model } = build({ deleteMany: vi.fn().mockRejectedValue(new Error('mongo is down')) });

      await expect(model.revokeAllForUser(USER)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
