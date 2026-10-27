import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ConversationModel, UserModel } from '@repo/models';
import { Connection, Types } from 'mongoose';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class ConversationService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly conversationModel: ConversationModel,
    private readonly userModel: UserModel,
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
      const missingMember = foundUsers.find(
        (member) => !members.includes(member.id),
      );
      throw new NotFoundException(
        `user with id:${missingMember?.id} does not exist`,
      );
    }
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        const memberIds = members.map((id) => new Types.ObjectId(id));
        const isGroupChat = members.length > 2;
        const newConversation = await this.conversationModel.createConversation(
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

        await this.userModel.addConversationToUser(
          { conversationId: newConversation._id, userIds: memberIds },
          session,
        );
      });
    } finally {
      await session.endSession();
    }
  }
}
