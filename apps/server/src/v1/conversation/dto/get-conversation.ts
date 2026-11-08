import { Transform } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, IsArray, IsMongoId } from 'class-validator';

export class GetConversationByMembersIdDto {
  @Transform(({ value }) =>
    (Array.isArray(value) ? value : String(value).split(','))
      .map((id: string) => id.trim())
      .filter(Boolean),
  )
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsMongoId({ each: true })
  members!: string[];
}

export class GetConversationByIdDto {
  @IsMongoId()
  conversationId!: string;
}
