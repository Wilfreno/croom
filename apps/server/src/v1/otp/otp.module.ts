import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpAttemptModel, OtpModel, UserModel } from '@repo/models';
import {
  OTP,
  OtpAttempt,
  OtpAttemptSchema,
  OTPSchema,
  User,
  UserSchema,
} from '@repo/schemas';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OTP.name, schema: OTPSchema },
      { name: OtpAttempt.name, schema: OtpAttemptSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [OtpController],
  providers: [OtpModel, OtpAttemptModel, UserModel, OtpService],
  exports: [OtpService],
})
export class OtpModule {}
