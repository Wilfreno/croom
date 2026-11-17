import { IsMongoId } from 'class-validator';

export class LeaveConversationDto {
  @IsMongoId()
  conversationId!: string;
}
