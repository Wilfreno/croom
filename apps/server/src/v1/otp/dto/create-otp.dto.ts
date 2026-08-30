import { OTPType } from '@repo/enums';
import { IsEmail, IsEnum } from 'class-validator';

export class CreateOtpDto {
  @IsEnum(OTPType)
  type!: OTPType;

  @IsEmail()
  email!: string;
}
