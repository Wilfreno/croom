import { IsString } from 'class-validator';

export class GetConversationMediaDto {
  @IsString()
  conversationId!: string;
}
