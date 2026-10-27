import { Body, Controller, Post } from '@nestjs/common';
import type { AuthenticatedUser } from '@repo/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  create(
    @CurrentUser() { id }: AuthenticatedUser,
    @Body() { members }: CreateConversationDto,
  ) {
    return this.conversationService.create({ userId: id, members });
  }
}
