import { IsMongoId } from 'class-validator';

export class BlockConversationDto {
  @IsMongoId()
  conversationId!: string;
}
