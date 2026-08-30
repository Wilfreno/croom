import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OTP_LOCKOUT_SECONDS, OTP_MAX_ATTEMPTS } from '@repo/constants';
import { OTPType } from '@repo/enums';
import { OtpAttempt } from '@repo/schemas';
import { Model } from 'mongoose';

type Target = { email: string; type: OTPType };

@Injectable()
export class OtpAttemptModel {
  private readonly logger = new Logger(OtpAttemptModel.name);

  constructor(@InjectModel(OtpAttempt.name) private OtpAttempt: Model<OtpAttempt>) {}

  /** Seconds left on the restriction, or 0 when the email is free to request. */
  async getLockRemainder({ email, type }: Target): Promise<number> {
    try {
      const record = await this.OtpAttempt.findOne({ email, type }, { lockedUntil: 1 });

      if (!record?.lockedUntil) return 0;

      const remainder = Math.ceil((record.lockedUntil.getTime() - Date.now()) / 1000);

      // the TTL monitor only sweeps once a minute, so a lapsed lockout can
      // still be on disk; the clock decides, not the presence of the record
      return remainder > 0 ? remainder : 0;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  /**
   * Counts one wrong pin. Returns the seconds the email is now locked for, or 0
   * while it is still under the cap.
   */
  async registerFailure({ email, type }: Target): Promise<number> {
    try {
      const now = new Date();

      // $inc inside findOneAndUpdate is atomic, so pins guessed in parallel
      // cannot each read the same count and slip past the cap together
      const record = await this.OtpAttempt.findOneAndUpdate(
        { email, type },
        { $inc: { failedAttempts: 1 }, $set: { dateUpdated: now } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );

      if (record.failedAttempts < OTP_MAX_ATTEMPTS) return 0;

      // the streak is spent: start the lockout and clear the count so the email
      // gets a full set of attempts back once the window lapses
      await this.OtpAttempt.updateOne(
        { email, type },
        {
          $set: {
            failedAttempts: 0,
            lockedUntil: new Date(now.getTime() + OTP_LOCKOUT_SECONDS * 1000),
            dateUpdated: now,
          },
        },
      );

      return OTP_LOCKOUT_SECONDS;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  /** Drops the failure streak after a correct pin. Leaves the pins alone. */
  async clearStreak({ email, type }: Target): Promise<void> {
    try {
      await this.OtpAttempt.deleteOne({ email, type });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
