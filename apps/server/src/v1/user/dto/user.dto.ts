import { User } from '@repo/schemas';
import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto implements Partial<User> {
  @IsEmail()
  email!: string;

  @IsString()
  password?: string;
}
