import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { IsMember, NotBlocked } from '@repo/guards';
import type { AuthenticatedUser } from '@repo/types';
import { PaginationPageDTO } from 'src/common/dto/pagination-page.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConversationService } from './conversation.service';
import {
  GetConversationByIdDto,
  GetConversationByMembersIdDto,
} from './dto/get-conversation';
import { BlockConversationDto } from './dto/block-conversation.dto';
import { GetConversationMediaDto } from './dto/get-media.dto';
import { GetConversationMessageDto } from './dto/get-message.dto';

@Controller({ path: 'conversation', version: '1' })
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

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

  @IsMember({ param: 'conversationId' })
  @Get('/:conversationId')
  getConversationById(@Param() { conversationId }: GetConversationByIdDto) {
    return this.conversationService.getConversationById(conversationId);
  }

  @NotBlocked({ param: 'conversationId' })
  @IsMember({ param: 'conversationId' })
  @Get('/:conversationId/media')
  getConversationMedia(@Param() { conversationId }: GetConversationMediaDto) {
    return this.conversationService.getConversationMedia(conversationId);
  }

  @IsMember({ param: 'conversationId' })
  @Post('/:conversationId/block')
  blockConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { conversationId }: BlockConversationDto,
  ) {
    return this.conversationService.blockConversation({
      conversationId,
      userId: user.id,
    });
  }

  @IsMember({ param: 'conversationId' })
  @Delete('/:conversationId/block')
  unblockConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { conversationId }: BlockConversationDto,
  ) {
    return this.conversationService.unblockConversation({
      conversationId,
      userId: user.id,
    });
  }
}
