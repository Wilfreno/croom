import { IsMongoId, IsString } from 'class-validator';

export class GetConversationMessageDto {
  @IsString()
  @IsMongoId()
  conversationId!: string;
}
