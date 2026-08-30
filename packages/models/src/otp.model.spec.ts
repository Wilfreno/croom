import { InternalServerErrorException } from '@nestjs/common';
import { OTPType } from '@repo/enums';
import { OTP } from '@repo/schemas';
import { Model } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OtpModel } from './otp.model';

const target = { email: 'someone@example.com', type: OTPType.SIGNUP };

function chain(result: unknown) {
  const lean = vi.fn().mockResolvedValue(result);
  const skip = vi.fn(() => ({ lean }));
  const sort = vi.fn(() => ({ skip, lean }));
  return { find: vi.fn(() => ({ sort, skip, lean })), sort, skip, lean };
}

function build(found: unknown = []) {
  const links = chain(found);
  const collection = {
    create: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(null),
    find: links.find,
    deleteMany: vi.fn().mockResolvedValue(undefined),
  };

  return {
    collection,
    links,
    model: new OtpModel(collection as unknown as Model<OTP>),
  };
}

describe('OtpModel', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    it('stores the pin for the target', async () => {
      const { collection, model } = build();

      await model.create({ ...target, pin: '123456' });

      expect(collection.create).toHaveBeenCalledWith([{ ...target, pin: '123456' }]);
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.create.mockRejectedValue(new Error('connection lost'));

      await expect(
        model.create({ ...target, pin: '123456' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('exist', () => {
    it('is false when nothing matches', async () => {
      const { model } = build();

      await expect(model.exist({ ...target, pin: '123456' })).resolves.toBe(false);
    });

    it('is true when a document matches', async () => {
      const { collection, model } = build();
      collection.exists.mockResolvedValue({ _id: 'abc' });

      await expect(model.exist({ ...target, pin: '123456' })).resolves.toBe(true);
    });
  });

  describe('getPins', () => {
    it('returns just the pin strings', async () => {
      const { model } = build([{ pin: '111111' }, { pin: '222222' }]);

      await expect(model.getPins(target)).resolves.toEqual(['111111', '222222']);
    });

    it('returns an empty list when nothing is live', async () => {
      const { model } = build([]);

      await expect(model.getPins(target)).resolves.toEqual([]);
    });

    it('asks only for the pin field', async () => {
      const { collection, model } = build([]);

      await model.getPins(target);

      expect(collection.find).toHaveBeenCalledWith(target, { pin: 1, _id: 0 });
    });

    it('turns a driver failure into a 500', async () => {
      const { links, model } = build();
      links.lean.mockRejectedValue(new Error('connection lost'));

      await expect(model.getPins(target)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('trim', () => {
    it('keeps the newest pins and deletes what is past the cap', async () => {
      const { collection, links, model } = build([{ _id: 'old1' }, { _id: 'old2' }]);

      await model.trim(target, 3);

      expect(links.sort).toHaveBeenCalledWith({ dateCreated: -1 });
      expect(links.skip).toHaveBeenCalledWith(3);
      expect(collection.deleteMany).toHaveBeenCalledWith({
        _id: { $in: ['old1', 'old2'] },
      });
    });

    it('does not issue a delete when nothing is past the cap', async () => {
      const { collection, model } = build([]);

      await model.trim(target, 3);

      expect(collection.deleteMany).not.toHaveBeenCalled();
    });

    it('turns a driver failure into a 500', async () => {
      const { links, model } = build();
      links.lean.mockRejectedValue(new Error('connection lost'));

      await expect(model.trim(target, 3)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteOtpByEmail', () => {
    it('drops every pin for the target', async () => {
      const { collection, model } = build();

      await model.deleteOtpByEmail(target);

      expect(collection.deleteMany).toHaveBeenCalledWith(target, {
        session: undefined,
      });
    });

    it('joins the caller transaction when given a session', async () => {
      const { collection, model } = build();
      const session = { id: 'session' } as never;

      await model.deleteOtpByEmail(target, session);

      expect(collection.deleteMany).toHaveBeenCalledWith(target, { session });
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.deleteMany.mockRejectedValue(new Error('connection lost'));

      await expect(model.deleteOtpByEmail(target)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
