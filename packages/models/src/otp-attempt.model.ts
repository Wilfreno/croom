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

  async getLockRemainder({ email, type }: Target): Promise<number> {
    try {
      const record = await this.OtpAttempt.findOne({ email, type }, { lockedUntil: 1 });

      if (!record?.lockedUntil) return 0;

      const remainder = Math.ceil((record.lockedUntil.getTime() - Date.now()) / 1000);

      return remainder > 0 ? remainder : 0;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }


  async registerFailure({ email, type }: Target): Promise<number> {
    try {
      const now = new Date();

      const record = await this.OtpAttempt.findOneAndUpdate(
        { email, type },
        { $inc: { failedAttempts: 1 }, $set: { dateUpdated: now } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );

      if (record.failedAttempts < OTP_MAX_ATTEMPTS) return 0;

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

  async clearStreak({ email, type }: Target): Promise<void> {
    try {
      await this.OtpAttempt.deleteOne({ email, type });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
