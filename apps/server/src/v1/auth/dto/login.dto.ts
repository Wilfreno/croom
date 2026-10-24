import { LoginCredentials } from '@repo/types';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto implements LoginCredentials {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
