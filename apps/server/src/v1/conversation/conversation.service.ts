import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ConversationModel, MessageModel, PhotoModel, UserModel } from '@repo/models';
import { Connection, Types } from 'mongoose';
import { PaginationPageDTO } from 'src/common/dto/pagination-page.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { GetConversationByIdDto } from './dto/get-conversation';
import { GetConversationMessageDto } from './dto/get-message.dto';

@Injectable()
export class ConversationService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly conversationModel: ConversationModel,
    private readonly userModel: UserModel,
    private readonly messageModel: MessageModel,
    private readonly photoModel: PhotoModel,
  ) {}

  async create({
    members,
    userId,
  }: CreateConversationDto & { userId: string }) {
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
    const session = await this.connection.startSession();
    let newConversation: Awaited<
      ReturnType<ConversationModel['createConversation']>
    >;

    try {
      await session.withTransaction(async () => {
        const memberIds = members.map((id) => new Types.ObjectId(id));
        const isGroupChat = members.length > 2;
        newConversation = await this.conversationModel.createConversation(
          {
            name: isGroupChat
              ? foundUsers.map((user) => user.displayName).join(', ')
              : '',
            members: memberIds,
            admins: isGroupChat ? [new Types.ObjectId(userId)] : memberIds,
            nicknames: members.map((member) => ({
              user: new Types.ObjectId(member),
              value: '',
            })),
          },
          session,
        );
      });
    } finally {
      await session.endSession();
    }

    return newConversation!;
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
    return await this.conversationModel.findConversationByMembers([
      ...members,
      userId,
    ]);
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
}
