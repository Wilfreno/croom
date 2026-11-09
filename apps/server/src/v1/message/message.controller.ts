import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { IsFirstMessage, IsMember, NotBlocked } from '@repo/guards';
import type { AuthenticatedUser } from '@repo/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateMessageDto } from './dto/create-message.dto';
import { SeenByDto } from './dto/seenby.dto';
import { MessageService } from './message.service';

@Controller({ path: 'message', version: '1' })
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @IsFirstMessage()
  @NotBlocked({ body: 'conversationId' })
  @IsMember({ body: 'conversationId' })
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() { text, photos, conversationId, members }: CreateMessageDto,
  ) {
    return this.messageService.create({
      text,
      photos,
      conversationId,
      members,
      userId: user.id,
    });
  }

  @NotBlocked({ body: 'conversationId' })
  @IsMember({ body: 'conversationId' })
  @Patch('/:messageId/:fieldName')
  updateMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { messageId, fieldName }: SeenByDto,
  ) {
    return this.messageService.updateMessage({
      userId: user.id,
      fieldName,
      messageId,
    });
  }
}
