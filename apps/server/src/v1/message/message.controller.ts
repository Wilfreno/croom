import { Body, Controller, Post } from '@nestjs/common';
import { IsBlocked, IsMember } from '@repo/guards';
import type { AuthenticatedUser } from '@repo/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageService } from './message.service';

@Controller({ path: 'message', version: '1' })
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @IsBlocked({ body: 'conversationId' })
  @IsMember({ body: 'conversationId' })
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() { text, photos, conversationId }: CreateMessageDto,
  ) {
    return this.messageService.create({
      text,
      photos,
      conversationId,
      userId: user.id,
    });
  }
}
