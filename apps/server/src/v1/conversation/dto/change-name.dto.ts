import { CONVERSATION_NAME_MAX_LENGTH } from '@repo/constants';
import { Transform } from 'class-transformer';
import { IsMongoId, IsString, MaxLength } from 'class-validator';

export class ChangeNameParamDto {
  @IsMongoId()
  conversationId!: string;
}

export class ChangeNameDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(CONVERSATION_NAME_MAX_LENGTH)
  name!: string;
}
