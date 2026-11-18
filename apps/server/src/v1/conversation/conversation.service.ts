import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ConversationStatus, MessageNoticeType, PhotoType } from '@repo/enums';
import {
  ConversationModel,
  MessageModel,
  PhotoModel,
  UserModel,
} from '@repo/models';
import type { ConversationMembersChangedPayload } from '@repo/types';
import { hasGroupMemberCount } from '@repo/utils';
import { ClientSession, Connection, Types } from 'mongoose';
import { PaginationPageDTO } from 'src/common/dto/pagination-page.dto';
import { ServerException } from 'src/common/exceptions/server-response.exception';
import { UploadedFilesService } from '../../common/uploaded-files/uploaded-files.service';
import { CallGateway } from '../call/call.gateway';
import { MessageGateway } from '../message/message.gateway';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { GetConversationByIdDto } from './dto/get-conversation';
import { GetConversationMessageDto } from './dto/get-message.dto';
import { SetNicknameDto } from './dto/set-nickname.dto';

@Injectable()
export class ConversationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly conversationModel: ConversationModel,
    private readonly userModel: UserModel,
    private readonly messageModel: MessageModel,
    private readonly photoModel: PhotoModel,
    private readonly callGateway: CallGateway,
    @InjectConnection() private readonly connection: Connection,
    private readonly messageGateway: MessageGateway,
    private readonly uploadedFiles: UploadedFilesService,
  ) {}

  async onApplicationBootstrap() {
    const updated = await this.conversationModel.backfillIsGroupChat();
    if (updated > 0)
      this.logger.log(`added isGroupChat to ${updated} conversations`);
  }

  /**
   * Creates a conversation inside the caller's transaction. Used to create
   * the conversation together with its first message.
   */
  async create(
    { members, userId }: CreateConversationDto & { userId: string },
    session: ClientSession,
  ) {
    if (members.length === 2) {
      if (await this.conversationModel.checkConversationExistByMembers(members))
        throw new ConflictException('conversation already exist');
    }

    const foundUsers = await this.userModel.getUsersByIds(members);

    if (foundUsers.length !== members.length) {
      const foundIds = foundUsers.map((user) => user.id);
      const missingMember = members.find((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `user with id:${missingMember} does not exist`,
      );
    }

    const memberIds = members.map((id) => new Types.ObjectId(id));
    const isGroupChat = hasGroupMemberCount(members);

    return await this.conversationModel.createConversation(
      {
        name: '',
        isGroupChat,
        members: memberIds,
        admins: isGroupChat ? [new Types.ObjectId(userId)] : memberIds,
        nicknames: members.map((member) => ({
          user: new Types.ObjectId(member),
          value: '',
        })),
      },
      session,
    );
  }

  async createConversation({
    members,
    userId,
  }: CreateConversationDto & { userId: string }) {
    const memberIds = [...new Set([...members, userId])];
    if (memberIds.length < 2)
      throw new BadRequestException('a conversation needs someone else in it');
    const session = await this.connection.startSession();
    let conversationId: string | undefined;

    try {
      await session.withTransaction(async () => {
        const conversation = await this.create(
          { members: memberIds, userId },
          session,
        );
        conversationId = String(conversation._id);
      });
    } finally {
      await session.endSession();
    }

    if (!conversationId)
      throw new InternalServerErrorException('conversation was not created');

    return await this.conversationModel.findConversationPayloadById(
      conversationId,
    );
  }

  async getConversationMessages({
    conversationId,
    page,
  }: GetConversationMessageDto & PaginationPageDTO) {
    const limit = 15;
    const skip = (Number(page) - 1) * limit;

    return await this.messageModel.getMessagesByConversationId({
      conversationId,
      limit,
      skip,
    });
  }

  async getConversationByMembersId(members: string[], userId: string) {
    return await this.conversationModel.findConversationByMembers(
      [...members, userId],
      userId,
    );
  }

  async getConversationById(
    conversationId: GetConversationByIdDto['conversationId'],
  ) {
    return await this.conversationModel.findConversationPayloadById(
      conversationId,
    );
  }

  async getConversationMedia(conversationId: string) {
    return await this.photoModel.getPhotosByConversationId(conversationId);
  }

  async blockConversation({
    conversationId,
    userId,
  }: {
    conversationId: string;
    userId: string;
  }) {
    const conversation =
      await this.conversationModel.findConversationById(conversationId);

    if (!conversation || conversation.status === ConversationStatus.DELETED)
      throw new NotFoundException('conversation does not exist');
    if (conversation.isGroupChat)
      throw new BadRequestException(
        'only one-to-one conversations can be blocked',
      );
    if (conversation.status === ConversationStatus.BLOCKED)
      throw new ConflictException('conversation is already blocked');

    if (
      !(await this.conversationModel.blockConversation({
        conversationId,
        userId,
      }))
    )
      throw new ConflictException('conversation is already blocked');

    await this.callGateway.endCall(
      conversationId,
      'this conversation was blocked',
    );
  }

  async addAdmin({
    conversationId,
    memberId,
    requesterId,
  }: {
    conversationId: string;
    memberId: string;
    requesterId: string;
  }) {
    const conversation = await this.findGroup(conversationId);
    const memberIds = conversation.members.map(String);
    const adminIds = conversation.admins.map(String);

    if (!memberIds.includes(memberId))
      throw new NotFoundException('user is not a member of this conversation');
    if (adminIds.includes(memberId))
      throw new ConflictException('user is already an admin');

    const added = await this.conversationModel.addAdmin({
      conversationId,
      memberId,
      requesterId,
    });
    if (!added)
      throw new ConflictException(
        'the admins of this conversation changed, try again',
      );

    return { memberId };
  }

  async removeAdmin({
    conversationId,
    memberId,
    requesterId,
  }: {
    conversationId: string;
    memberId: string;
    requesterId: string;
  }) {
    const conversation = await this.findGroup(conversationId);
    const adminIds = conversation.admins.map(String);

    if (!adminIds.includes(memberId))
      throw new ConflictException('user is not an admin');
    if (adminIds.length < 2)
      throw new ConflictException('a group needs at least one admin');

    const removed = await this.conversationModel.removeAdmin({
      conversationId,
      memberId,
      requesterId,
    });
    if (!removed)
      throw new ConflictException(
        'the admins of this conversation changed, try again',
      );

    return { memberId };
  }

  async addMember({
    conversationId,
    memberId,
    requesterId,
  }: {
    conversationId: string;
    memberId: string;
    requesterId: string;
  }) {
    const conversation = await this.findGroup(conversationId);
    const memberIds = conversation.members.map(String);

    if (memberIds.includes(memberId))
      throw new ConflictException('user is already a member');

    const [user] = await this.userModel.getUsersByIds([memberId]);
    if (!user) throw new NotFoundException('user does not exist');

    const added = await this.conversationModel.addMember({
      conversationId,
      memberId,
      requesterId,
    });
    if (!added)
      throw new ConflictException(
        'the members of this conversation changed, try again',
      );

    this.notifyMembersChanged([...memberIds, memberId], requesterId, {
      conversationId,
    });

    return { memberId };
  }

  async removeMember({
    conversationId,
    memberId,
    requesterId,
  }: {
    conversationId: string;
    memberId: string;
    requesterId: string;
  }) {
    if (memberId === requesterId)
      throw new BadRequestException('you cannot remove yourself');

    const conversation = await this.findGroup(conversationId);
    const memberIds = conversation.members.map(String);

    if (!memberIds.includes(memberId))
      throw new NotFoundException('user is not a member of this conversation');

    const removed = await this.conversationModel.removeMember({
      conversationId,
      memberId,
      requesterId,
    });
    if (!removed)
      throw new ConflictException(
        'the members of this conversation changed, try again',
      );

    await this.callGateway.removeFromCall(
      conversationId,
      memberId,
      'you were removed from this group',
    );
    this.notifyMembersChanged(memberIds, requesterId, {
      conversationId,
      removedMemberId: memberId,
    });

    return { memberId };
  }

  async leaveConversation({
    conversationId,
    userId,
  }: {
    conversationId: string;
    userId: string;
  }) {
    const conversation = await this.findGroup(conversationId);
    const adminIds = conversation.admins.map(String);
    const otherMemberIds = conversation.members
      .map(String)
      .filter((memberId) => memberId !== userId);

    const isOnlyAdmin = adminIds.length === 1 && adminIds[0] === userId;
    if (isOnlyAdmin && otherMemberIds.length > 1)
      throw new ConflictException(
        'make another member an admin before leaving the group',
      );

    const newAdminId = isOnlyAdmin ? otherMemberIds[0] : undefined;

    const left = await this.conversationModel.leaveConversation({
      conversationId,
      memberId: userId,
      newAdminId,
      isLastMember: otherMemberIds.length === 0,
    });
    if (!left)
      throw new ConflictException(
        'the members of this conversation changed, try again',
      );

    await this.callGateway.removeFromCall(
      conversationId,
      userId,
      'you left this group',
    );
    this.notifyMembersChanged(otherMemberIds, userId, {
      conversationId,
      removedMemberId: userId,
    });

    return { conversationId, newAdminId: newAdminId ?? null };
  }

  async changePhoto({
    conversationId,
    photoId,
    requesterId,
  }: {
    conversationId: string;
    photoId: string;
    requesterId: string;
  }) {
    await this.findGroup(conversationId);

    const session = await this.connection.startSession();
    let newPhotoUrl = '';
    let previousPhotoKey: string | null = null;

    try {
      await session.withTransaction(async () => {
        const claimedPhoto = await this.photoModel.claimPendingPhoto(
          { photoId, ownerId: requesterId, type: PhotoType.CONVERSATION },
          session,
        );
        if (!claimedPhoto) throw new NotFoundException('photo does not exist');
        newPhotoUrl = claimedPhoto.url;

        const { changed, previousPhotoId } =
          await this.conversationModel.setPhoto(
            { conversationId, photoId, requesterId },
            session,
          );
        if (!changed)
          throw new ConflictException(
            'the admins of this conversation changed, try again',
          );

        previousPhotoKey = previousPhotoId
          ? await this.photoModel.deleteById(previousPhotoId, session)
          : null;
      });
    } finally {
      await session.endSession();
    }

    if (previousPhotoKey)
      await this.uploadedFiles.deleteFiles([previousPhotoKey]);

    return { photo: { id: photoId, url: newPhotoUrl } };
  }

  async changeName({
    conversationId,
    name,
    requesterId,
  }: {
    conversationId: string;
    name: string;
    requesterId: string;
  }) {
    await this.findGroup(conversationId);

    const changed = await this.conversationModel.setName({
      conversationId,
      name,
      requesterId,
    });
    if (!changed)
      throw new ConflictException(
        'the admins of this conversation changed, try again',
      );

    return { name };
  }

  private notifyMembersChanged(
    recipientIds: string[],
    actorId: string,
    payload: ConversationMembersChangedPayload,
  ) {
    this.messageGateway.emitToUsers(
      recipientIds.filter((recipientId) => recipientId !== actorId),
      'CONVERSATION_MEMBERS_CHANGED',
      payload,
    );
  }

  private async findGroup(conversationId: string) {
    const conversation =
      await this.conversationModel.findConversationById(conversationId);

    if (!conversation || conversation.status === ConversationStatus.DELETED)
      throw new NotFoundException('conversation does not exist');
    if (!conversation.isGroupChat)
      throw new BadRequestException(
        'only group conversations have admins and members to manage',
      );

    return conversation;
  }

  async setNickname({
    conversationId,
    user,
    value,
    userId,
  }: SetNicknameDto & { conversationId: string; userId: string }) {
    const conversation =
      await this.conversationModel.findConversationById(conversationId);

    if (!conversation)
      throw new NotFoundException('conversation does not exist');
    if (conversation.status === ConversationStatus.BLOCKED)
      throw new ServerException('BLOCKED', 'this conversation is blocked');

    const session = await this.connection.startSession();
    let noticeId: Types.ObjectId | undefined;

    try {
      await session.withTransaction(async () => {
        noticeId = undefined;
        const { found, changed } = await this.conversationModel.setNickname(
          { conversationId, userId: user, value },
          session,
        );

        if (!found)
          throw new NotFoundException(
            'user is not a member of this conversation',
          );
        if (!changed) return;

        const notice = await this.messageModel.createMessage(
          {
            conversation: new Types.ObjectId(conversationId),
            sender: new Types.ObjectId(userId),
            notice: {
              type: MessageNoticeType.NICKNAME,
              user: new Types.ObjectId(user),
              value,
            },
          },
          session,
        );
        noticeId = notice._id;
      });
    } finally {
      await session.endSession();
    }

    if (!noticeId) return { user, value, message: null };

    const message = await this.messageModel.findMessagePayloadById(noticeId);

    if (message)
      this.messageGateway.emitToUsers(
        conversation.members
          .map((member) => String(member))
          .filter((memberId) => memberId !== userId),
        'MESSAGE',
        message,
      );

    return { user, value, message };
  }

  async unblockConversation({
    conversationId,
    userId,
  }: {
    conversationId: string;
    userId: string;
  }) {
    const conversation =
      await this.conversationModel.findConversationById(conversationId);

    if (!conversation)
      throw new NotFoundException('conversation does not exist');
    if (conversation.status !== ConversationStatus.BLOCKED)
      throw new ConflictException('conversation is not blocked');
    if (String(conversation.blocker) !== userId)
      throw new ForbiddenException('only the user who blocked can unblock');

    if (
      !(await this.conversationModel.unblockConversation({
        conversationId,
        userId,
      }))
    )
      throw new ConflictException('conversation is not blocked');
  }
}
