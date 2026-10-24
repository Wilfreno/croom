import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { OTP_EXPIRY_MINUTES, SECONDS_IN_MINUTE } from '@repo/constants';
import { OTPType } from '@repo/enums';
import { HydratedDocument } from 'mongoose';
export type OTPDocument = HydratedDocument<OTP>;

@Schema({ collection: 'otp' })
export class OTP {
  @Prop({ type: String, required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })
  email!: string;

  @Prop({
    type: String,
    enum: OTPType,
    required: true,
  })
  type!: OTPType;

  @Prop({ type: String, required: true })
  pin!: string;

  @Prop({ type: Date, required: false, default: Date.now })
  dateCreated!: Date;
}

export const OTPSchema = SchemaFactory.createForClass(OTP);

OTPSchema.index({ email: 1, type: 1 });

OTPSchema.index({ dateCreated: 1 }, { expireAfterSeconds: OTP_EXPIRY_MINUTES * SECONDS_IN_MINUTE });
