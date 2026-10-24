import { AuthServiceOptions } from '@repo/enums';
import { SignUpFormData } from '@repo/types';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto implements Partial<SignUpFormData> {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  confirmPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  pin?: string;

  @IsEnum(AuthServiceOptions)
  authService!: string;
}
