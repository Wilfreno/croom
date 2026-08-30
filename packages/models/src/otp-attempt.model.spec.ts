import { InternalServerErrorException } from '@nestjs/common';
import { OTP_LOCKOUT_SECONDS, OTP_MAX_ATTEMPTS } from '@repo/constants';
import { OTPType } from '@repo/enums';
import { OtpAttempt } from '@repo/schemas';
import { Model } from 'mongoose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OtpAttemptModel } from './otp-attempt.model';

const target = { email: 'someone@example.com', type: OTPType.SIGNUP };

function build() {
  const collection = {
    findOne: vi.fn().mockResolvedValue(null),
    findOneAndUpdate: vi.fn().mockResolvedValue({ failedAttempts: 1 }),
    updateOne: vi.fn().mockResolvedValue(undefined),
    deleteOne: vi.fn().mockResolvedValue(undefined),
  };

  return {
    collection,
    model: new OtpAttemptModel(collection as unknown as Model<OtpAttempt>),
  };
}

describe('OtpAttemptModel', () => {
  let ctx: ReturnType<typeof build>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    ctx = build();
  });

  afterEach(() => vi.useRealTimers());

  describe('getLockRemainder', () => {
    it('reports no lock when the email has no record', async () => {
      ctx.collection.findOne.mockResolvedValue(null);

      await expect(ctx.model.getLockRemainder(target)).resolves.toBe(0);
    });

    it('reports no lock when the record carries no lockedUntil', async () => {
      ctx.collection.findOne.mockResolvedValue({ failedAttempts: 2 });

      await expect(ctx.model.getLockRemainder(target)).resolves.toBe(0);
    });

    it('reports the seconds left on a live lock', async () => {
      ctx.collection.findOne.mockResolvedValue({
        lockedUntil: new Date(Date.now() + 90_000),
      });

      await expect(ctx.model.getLockRemainder(target)).resolves.toBe(90);
    });

    it('rounds a part-second remainder up so it never reads as unlocked', async () => {
      ctx.collection.findOne.mockResolvedValue({
        lockedUntil: new Date(Date.now() + 1),
      });

      await expect(ctx.model.getLockRemainder(target)).resolves.toBe(1);
    });

    it('treats a lapsed lock still on disk as unlocked', async () => {
      // the TTL monitor only sweeps about once a minute, so an expired record
      // can outlive its lockout; the clock has to decide, not its presence
      ctx.collection.findOne.mockResolvedValue({
        lockedUntil: new Date(Date.now() - 60_000),
      });

      await expect(ctx.model.getLockRemainder(target)).resolves.toBe(0);
    });

    it('reads only the lockedUntil field', async () => {
      await ctx.model.getLockRemainder(target);

      expect(ctx.collection.findOne).toHaveBeenCalledWith(target, {
        lockedUntil: 1,
      });
    });

    it('turns a driver failure into a 500 rather than leaking it', async () => {
      ctx.collection.findOne.mockRejectedValue(new Error('connection lost'));

      await expect(ctx.model.getLockRemainder(target)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('registerFailure', () => {
    it('counts the failure atomically and upserts a first one', async () => {
      await ctx.model.registerFailure(target);

      expect(ctx.collection.findOneAndUpdate).toHaveBeenCalledWith(
        target,
        { $inc: { failedAttempts: 1 }, $set: { dateUpdated: new Date() } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
    });

    it('stays unlocked while the streak is under the cap', async () => {
      ctx.collection.findOneAndUpdate.mockResolvedValue({
        failedAttempts: OTP_MAX_ATTEMPTS - 1,
      });

      await expect(ctx.model.registerFailure(target)).resolves.toBe(0);
      expect(ctx.collection.updateOne).not.toHaveBeenCalled();
    });

    it('locks the email once the streak reaches the cap', async () => {
      ctx.collection.findOneAndUpdate.mockResolvedValue({
        failedAttempts: OTP_MAX_ATTEMPTS,
      });

      await expect(ctx.model.registerFailure(target)).resolves.toBe(
        OTP_LOCKOUT_SECONDS,
      );

      expect(ctx.collection.updateOne).toHaveBeenCalledWith(target, {
        $set: {
          failedAttempts: 0,
          lockedUntil: new Date(Date.now() + OTP_LOCKOUT_SECONDS * 1000),
          dateUpdated: new Date(),
        },
      });
    });

    it('clears the count as it locks, so a lapsed lock restores a full set', async () => {
      ctx.collection.findOneAndUpdate.mockResolvedValue({
        failedAttempts: OTP_MAX_ATTEMPTS,
      });

      await ctx.model.registerFailure(target);

      expect(ctx.collection.updateOne.mock.calls[0][1].$set.failedAttempts).toBe(0);
    });

    it('still locks when the count overshoots the cap', async () => {
      ctx.collection.findOneAndUpdate.mockResolvedValue({
        failedAttempts: OTP_MAX_ATTEMPTS + 5,
      });

      await expect(ctx.model.registerFailure(target)).resolves.toBe(
        OTP_LOCKOUT_SECONDS,
      );
    });

    it('turns a driver failure into a 500', async () => {
      ctx.collection.findOneAndUpdate.mockRejectedValue(new Error('write conflict'));

      await expect(ctx.model.registerFailure(target)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('clearStreak', () => {
    it('drops the record for the target', async () => {
      await ctx.model.clearStreak(target);

      expect(ctx.collection.deleteOne).toHaveBeenCalledWith(target);
    });

    it('turns a driver failure into a 500', async () => {
      ctx.collection.deleteOne.mockRejectedValue(new Error('connection lost'));

      await expect(ctx.model.clearStreak(target)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
