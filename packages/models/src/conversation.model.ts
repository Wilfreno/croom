import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConversationStatus, UserStatus } from '@repo/enums';
import { Conversation } from '@repo/schemas';
import type { CallMember } from '@repo/types';
import { ClientSession, Model, Types } from 'mongoose';
import { toEntity } from './pipeline';

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

  async getCallMembersByConversationId(conversationId: string): Promise<CallMember[] | null> {
    try {
      const [conversation] = await this.Conversation.aggregate<{ members: CallMember[] }>([
        { $match: { _id: new Types.ObjectId(conversationId) } },
        {
          $lookup: {
            from: 'user',
            localField: 'members',
            foreignField: '_id',
            as: 'members',
            pipeline: [
              { $project: { displayName: 1, photo: 1 } },
              {
                $lookup: {
                  from: 'photo',
                  localField: 'photo',
                  foreignField: '_id',
                  as: 'photo',
                  pipeline: [{ $project: { url: 1 } }],
                },
              },
              { $set: { photoUrl: { $ifNull: [{ $first: '$photo.url' }, null] } } },
              { $unset: 'photo' },
              ...toEntity,
            ],
          },
        },
        { $project: { _id: 0, members: 1 } },
      ]);

      return conversation?.members ?? null;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  /** A conversation with its members, admins and photo populated, as the client renders it. */
  async findConversationPayloadById(conversationId: string) {
    const userFields = 'email userName displayName photo status lastOnline';
    const userPopulate = { path: 'photo', select: 'url' };

    try {
      return await this.Conversation.findOne({ _id: conversationId }).populate([
        { path: 'members', select: userFields, populate: userPopulate },
        { path: 'admins', select: userFields, populate: userPopulate },
        { path: 'photo', select: 'url' },
      ]);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  /** Ids of every user who shares at least one conversation with the given user. */
  async getConversationPartnerIds(userId: string) {
    try {
      const memberIds = await this.Conversation.distinct('members', {
        members: new Types.ObjectId(userId),
      });
      return memberIds.map(String).filter((id) => id !== userId);
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

  async getConversationsByUserId(userId: string) {
    try {
      return await this.Conversation.aggregate([
        { $match: { members: new Types.ObjectId(userId) } },
        {
          $lookup: {
            from: 'photo',
            localField: 'photo',
            foreignField: '_id',
            as: 'photo',
            pipeline: [{ $project: { url: 1 } }],
          },
        },
        { $set: { photo: { $ifNull: [{ $first: '$photo' }, null] } } },
        {
          $lookup: {
            from: 'user',
            localField: 'members',
            foreignField: '_id',
            as: 'members',
            pipeline: [
              { $match: { _id: { $ne: new Types.ObjectId(userId) } } },
              {
                $lookup: {
                  from: 'photo',
                  localField: 'photo',
                  foreignField: '_id',
                  as: 'photo',
                  pipeline: [{ $project: { url: 1 } }],
                },
              },
              { $set: { photo: { $ifNull: [{ $first: '$photo' }, null] } } },
              { $project: { status: 1, displayName: 1, photo: 1 } },
            ],
          },
        },
        {
          $lookup: {
            from: 'message',
            localField: '_id',
            foreignField: 'conversation',
            as: 'messages',
            pipeline: [
              { $sort: { dateCreated: -1 } },
              { $limit: 1 },
              {
                $lookup: {
                  from: 'user',
                  localField: 'sender',
                  foreignField: '_id',
                  as: 'sender',
                  pipeline: [{ $project: { displayName: 1 } }],
                },
              },
              {
                $set: {
                  sender: { $ifNull: [{ $first: '$sender' }, null] },
                  seenBy: { $map: { input: '$seenBy', as: 'id', in: { _id: '$$id' } } },
                },
              },
            ],
          },
        },
      ]);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }


  async getActiveConversationByUserId(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    try {
      return await this.Conversation.aggregate([
        { $match: { members: userObjectId, status: { $ne: ConversationStatus.BLOCKED } } },
        {
          $lookup: {
            from: 'user',
            localField: 'members',
            foreignField: '_id',
            as: 'members',
            pipeline: [
              { $match: { _id: { $ne: userObjectId } } },
              {
                $lookup: {
                  from: 'photo',
                  localField: 'photo',
                  foreignField: '_id',
                  as: 'photo',
                  pipeline: [{ $project: { url: 1 } }],
                },
              },
              { $set: { photo: { $ifNull: [{ $first: '$photo' }, null] } } },
              { $project: { status: 1, displayName: 1, photo: 1 } },
            ],
          },
        },
        { $match: { 'members.status': UserStatus.ONLINE } },
        {
          $lookup: {
            from: 'photo',
            localField: 'photo',
            foreignField: '_id',
            as: 'photo',
            pipeline: [{ $project: { url: 1 } }],
          },
        },
        { $set: { photo: { $ifNull: [{ $first: '$photo' }, null] } } },
        { $project: { name: 1, photo: 1, members: 1, lastUpdated: 1 } },
        { $sort: { lastUpdated: -1 } },
      ]);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
