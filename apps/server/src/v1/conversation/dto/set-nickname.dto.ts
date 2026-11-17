import { NICKNAME_MAX_LENGTH } from '@repo/constants';
import { Transform } from 'class-transformer';
import { IsMongoId, IsString, MaxLength } from 'class-validator';

export class SetNicknameParamDto {
  @IsMongoId()
  conversationId!: string;
}

export class SetNicknameDto {
  @IsMongoId()
  user!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(NICKNAME_MAX_LENGTH)
  value!: string;
}
