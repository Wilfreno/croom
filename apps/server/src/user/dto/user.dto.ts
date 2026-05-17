import { UserStatus } from '@repo/enums';
import type { User } from '@repo/types/database/models';
import { IsDate, IsEmail, IsEnum, IsString } from 'class-validator';
export class CreateUserDto implements Partial<User> {
  @IsString()
  display_name!: string;

  @IsString()
  username!: string;

  @IsString()
  password?: string;

  @IsEmail()
  email!: string;

  @IsEnum(UserStatus)
  status!: UserStatus;

  @IsDate()
  last_online!: Date;

  @IsDate()
  date_created!: Date;

  @IsDate()
  last_updated!: Date;
}
