import { IsEmail, IsString, MinLength } from 'class-validator';

export class RecoverAccountDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(8)
  confirmPassword!: string;

  @IsString()
  @MinLength(6)
  pin!: string;
}
