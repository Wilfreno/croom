import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IsBlocked, IsMember } from '@repo/guards';
import type { AuthenticatedUser } from '@repo/types';
import { PaginationPageDTO } from 'src/common/dto/pagination-page.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { GetConversationByMembersIdDto } from './dto/get-conversation';
import { GetConversationMessageDto } from './dto/get-message.dto';

@Controller({ path: 'conversation', version: '1' })
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  create(
    @CurrentUser() { id }: AuthenticatedUser,
    @Body() { members }: CreateConversationDto,
  ) {
    return this.conversationService.create({
      userId: id,
      members: [...members, id],
    });
  }

  @IsBlocked({ param: 'conversationId' })
  @IsMember({ param: 'conversationId' })
  @Get('/:conversationId/messages')
  getConversationMessages(
    @Param() { conversationId }: GetConversationMessageDto,
    @Query() { page }: PaginationPageDTO,
  ) {
    return this.conversationService.getConversationMessages({
      conversationId,
      page,
    });
  }

  @Get()
  getConversationByMembersId(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { members }: GetConversationByMembersIdDto,
  ) {
    return this.conversationService.getConversationByMembersId(
      members,
      user.id,
    );
  }
}
