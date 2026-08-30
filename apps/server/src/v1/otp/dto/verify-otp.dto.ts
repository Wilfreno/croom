import { OTPType } from '@repo/enums';
import { IsEmail, IsEnum, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEnum(OTPType)
  type!: OTPType;

  @IsEmail()
  email!: string;

  @Length(6, 6)
  pin!: string;
}
