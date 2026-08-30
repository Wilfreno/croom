import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OTPType } from '@repo/enums';
import { OTP } from '@repo/schemas';
import { ClientSession, Model } from 'mongoose';

@Injectable()
export class OtpModel {
  private readonly logger = new Logger(OtpModel.name);

  constructor(@InjectModel(OTP.name) private OTP: Model<OTP>) {}

  async create({ email, type, pin }: { email: string; type: OTPType; pin: string }) {
    try {
      await this.OTP.create([{ email, type, pin }]);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async exist(data: { email: string; pin: string; type: OTPType }) {
    return Boolean((await this.OTP.exists(data)));
  }


  async getPins({ email, type }: { email: string; type: OTPType }): Promise<string[]> {
    try {
      const otps = await this.OTP.find({ email, type }, { pin: 1, _id: 0 }).lean();

      return otps.map(({ pin }) => pin);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  /** Drops the oldest pins for an email until only `keep` remain live. */
  async trim({ email, type }: { email: string; type: OTPType }, keep: number): Promise<void> {
    try {
      const stale = await this.OTP.find({ email, type }, { _id: 1 })
        .sort({ dateCreated: -1 })
        .skip(keep)
        .lean();

      if (!stale.length) return;

      await this.OTP.deleteMany({ _id: { $in: stale.map(({ _id }) => _id) } });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async deleteOtpByEmail({ email, type }: { email: string; type: OTPType }, session?: ClientSession): Promise<void> {
    try {
      await this.OTP.deleteMany({ email, type }, { session });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
