import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConversationStatus } from '@repo/enums';
import { Conversation } from '@repo/schemas';
import { ClientSession, Model, Types } from 'mongoose';

@Injectable()
export class ConversationModel {
  private readonly logger = new Logger(ConversationModel.name);

  constructor(@InjectModel(Conversation.name) private Conversation: Model<Conversation>) {}

  async checkConversationExistByMembers(members: string[]) {
    try {
      return Boolean(
        await this.Conversation.exists({
          members: { $size: members.length, $all: members.map((member) => new Types.ObjectId(member)) },
        }),
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async createConversation(data: Partial<Conversation>, session: ClientSession) {
    try {
      const newConversation = new this.Conversation(data);

      await newConversation.save({ session });

      return newConversation;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async isConversationMember({ conversationId, userId }: { conversationId: string; userId: string }) {
    try {
      return Boolean(
        await this.Conversation.exists({ _id: conversationId, members: { $in: [new Types.ObjectId(userId)] } }),
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  /** True when the conversation is blocked and `userId` is not the one who blocked it. */
  async isUserBlockedInConversation({ conversationId, userId }: { conversationId: string; userId: string }) {
    try {
      return Boolean(
        await this.Conversation.exists({
          _id: conversationId,
          status: ConversationStatus.BLOCKED,
          blocker: { $ne: userId },
        }),
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async findConversationById(conversationId: string) {
    try {
      return await this.Conversation.findOne({ _id: conversationId });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async findConversationByMembers(members: string[]) {
    try {
      return await this.Conversation.find({
        members: {
          $size: members.length,
          $all: members.map((member) => new Types.ObjectId(member)),
        },
      }).lean();
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
