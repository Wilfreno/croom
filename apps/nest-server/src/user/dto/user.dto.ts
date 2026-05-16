import { UserStatus } from '@repo/enums';
import type { User } from '@repo/types/database/models';
import { IsEmail, IsEnum, IsMongoId, IsString } from 'class-validator';
import type { Types } from 'mongoose';
export class CreateUserDto implements User {
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

  @IsMongoId()
  photo!: Types.ObjectId;
  conversations!: Types.ObjectId[];
  last_online!: Date;
  date_created!: Date;
  last_updated!: Date;
}
