import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { OTP_LOCKOUT_SECONDS } from '@repo/constants';
import { OTPType } from '@repo/enums';
import { HydratedDocument } from 'mongoose';
export type OtpAttemptDocument = HydratedDocument<OtpAttempt>;

/**
 * Tracks consecutive wrong pins for an email so a lockout can outlive the OTP
 * document it started on. Counting on the OTP itself is not enough: the pin is
 * deleted or expires, and the restriction has to survive that to keep the next
 * request from handing out a fresh code.
 */
@Schema({ collection: 'otp_attempt' })
export class OtpAttempt {
  @Prop({ type: String, required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })
  email!: string;

  @Prop({
    type: String,
    enum: OTPType,
    required: true,
  })
  type!: OTPType;

  @Prop({ type: Number, required: true, default: 0 })
  failedAttempts!: number;

  /** Null until the cap is hit; afterwards the instant the restriction lifts. */
  @Prop({ type: Date, required: false, default: null })
  lockedUntil!: Date | null;

  @Prop({ type: Date, required: true, default: Date.now })
  dateUpdated!: Date;
}

export const OtpAttemptSchema = SchemaFactory.createForClass(OtpAttempt);

OtpAttemptSchema.index({ email: 1, type: 1 }, { unique: true });

OtpAttemptSchema.index({ dateUpdated: 1 }, { expireAfterSeconds: OTP_LOCKOUT_SECONDS });
