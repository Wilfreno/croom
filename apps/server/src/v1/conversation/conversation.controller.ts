import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IsAdmin, IsMember, NotBlocked } from '@repo/guards';
import type { AuthenticatedUser } from '@repo/types';
import { PaginationPageDTO } from 'src/common/dto/pagination-page.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConversationService } from './conversation.service';
import {
  GetConversationByIdDto,
  GetConversationByMembersIdDto,
} from './dto/get-conversation';
import { BlockConversationDto } from './dto/block-conversation.dto';
import { ChangePhotoDto, ChangePhotoParamDto } from './dto/change-photo.dto';
import { LeaveConversationDto } from './dto/leave-conversation.dto';
import { GetConversationMediaDto } from './dto/get-media.dto';
import { GetConversationMessageDto } from './dto/get-message.dto';
import {
  AddAdminDto,
  AddAdminParamDto,
  RemoveAdminParamDto,
} from './dto/manage-admin.dto';
import {
  AddMemberDto,
  AddMemberParamDto,
  RemoveMemberParamDto,
} from './dto/manage-member.dto';
import { SetNicknameDto, SetNicknameParamDto } from './dto/set-nickname.dto';

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

  @NotBlocked({ param: 'conversationId' })
  @IsMember({ param: 'conversationId' })
  @Patch('/:conversationId/nicknames')
  setNickname(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param() { conversationId }: SetNicknameParamDto,
    @Body() { user, value }: SetNicknameDto,
  ) {
    return this.conversationService.setNickname({
      conversationId,
      user,
      value,
      userId: currentUser.id,
    });
  }

  @IsAdmin({ param: 'conversationId' })
  @IsMember({ param: 'conversationId' })
  @Patch('/:conversationId/photo')
  changePhoto(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param() { conversationId }: ChangePhotoParamDto,
    @Body() { photo }: ChangePhotoDto,
  ) {
    return this.conversationService.changePhoto({
      conversationId,
      photo,
      requesterId: currentUser.id,
    });
  }

  @IsAdmin({ param: 'conversationId' })
  @IsMember({ param: 'conversationId' })
  @Post('/:conversationId/admins')
  addAdmin(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param() { conversationId }: AddAdminParamDto,
    @Body() { memberId }: AddAdminDto,
  ) {
    return this.conversationService.addAdmin({
      conversationId,
      memberId,
      requesterId: currentUser.id,
    });
  }

  @IsAdmin({ param: 'conversationId' })
  @IsMember({ param: 'conversationId' })
  @Delete('/:conversationId/admins/:memberId')
  removeAdmin(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param() { conversationId, memberId }: RemoveAdminParamDto,
  ) {
    return this.conversationService.removeAdmin({
      conversationId,
      memberId,
      requesterId: currentUser.id,
    });
  }

  @IsAdmin({ param: 'conversationId' })
  @IsMember({ param: 'conversationId' })
  @Post('/:conversationId/members')
  addMember(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param() { conversationId }: AddMemberParamDto,
    @Body() { memberId }: AddMemberDto,
  ) {
    return this.conversationService.addMember({
      conversationId,
      memberId,
      requesterId: currentUser.id,
    });
  }

  @IsAdmin({ param: 'conversationId' })
  @IsMember({ param: 'conversationId' })
  @Delete('/:conversationId/members/:memberId')
  removeMember(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param() { conversationId, memberId }: RemoveMemberParamDto,
  ) {
    return this.conversationService.removeMember({
      conversationId,
      memberId,
      requesterId: currentUser.id,
    });
  }

  @IsMember({ param: 'conversationId' })
  @Post('/:conversationId/leave')
  leaveConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { conversationId }: LeaveConversationDto,
  ) {
    return this.conversationService.leaveConversation({
      conversationId,
      userId: user.id,
    });
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
