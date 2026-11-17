import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ConversationStatus, UserStatus } from "@repo/enums";
import { Conversation } from "@repo/schemas";
import type { CallMember } from "@repo/types";
import { ClientSession, Model, Types } from "mongoose";
import { toEntity } from "./pipeline";

@Injectable()
export class ConversationModel {
  private readonly logger = new Logger(ConversationModel.name);

  constructor(@InjectModel(Conversation.name) private Conversation: Model<Conversation>) {}

  async checkConversationExistByMembers(members: string[]) {
    try {
      return Boolean(
        await this.Conversation.exists({
          isGroupChat: false,
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

  async isConversationAdmin({ conversationId, userId }: { conversationId: string; userId: string }) {
    try {
      return Boolean(await this.Conversation.exists({ _id: conversationId, admins: new Types.ObjectId(userId) }));
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

  async isConversationBlocked(conversationId: string) {
    try {
      return Boolean(await this.Conversation.exists({ _id: conversationId, status: ConversationStatus.BLOCKED }));
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async blockConversation({ conversationId, userId }: { conversationId: string; userId: string }) {
    try {
      const result = await this.Conversation.updateOne(
        {
          _id: conversationId,
          isGroupChat: false,
          members: new Types.ObjectId(userId),
          status: { $nin: [ConversationStatus.BLOCKED, ConversationStatus.DELETED] },
        },
        { $set: { status: ConversationStatus.BLOCKED, blocker: new Types.ObjectId(userId) } },
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async unblockConversation({ conversationId, userId }: { conversationId: string; userId: string }) {
    try {
      const result = await this.Conversation.updateOne(
        { _id: conversationId, status: ConversationStatus.BLOCKED, blocker: new Types.ObjectId(userId) },
        { $unset: { status: 1, blocker: 1 } },
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async setNickname(
    { conversationId, userId, value }: { conversationId: string; userId: string; value: string },
    session?: ClientSession,
  ) {
    const userObjectId = new Types.ObjectId(userId);

    try {
      const result = await this.Conversation.updateOne(
        { _id: conversationId, members: userObjectId, "nicknames.user": userObjectId },
        { $set: { "nicknames.$.value": value } },
        { session },
      );
      return { found: result.matchedCount > 0, changed: result.modifiedCount > 0 };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
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
    const memberObjectId = new Types.ObjectId(memberId);

    try {
      const result = await this.Conversation.updateOne(
        {
          _id: conversationId,
          $and: [{ admins: new Types.ObjectId(requesterId) }, { admins: { $ne: memberObjectId } }],
          members: memberObjectId,
          isGroupChat: true,
        },
        { $addToSet: { admins: memberObjectId } },
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
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
    const memberObjectId = new Types.ObjectId(memberId);

    try {
      const result = await this.Conversation.updateOne(
        {
          _id: conversationId,
          admins: new Types.ObjectId(requesterId),
          members: { $ne: memberObjectId },
          isGroupChat: true,
          status: { $ne: ConversationStatus.DELETED },
        },
        {
          $addToSet: { members: memberObjectId },
          $push: { nicknames: { user: memberObjectId, value: "" } },
        },
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
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
    const memberObjectId = new Types.ObjectId(memberId);

    try {
      const result = await this.Conversation.updateOne(
        {
          _id: conversationId,
          admins: new Types.ObjectId(requesterId),
          members: memberObjectId,
          isGroupChat: true,
          status: { $ne: ConversationStatus.DELETED },
        },
        {
          $pull: {
            members: memberObjectId,
            admins: memberObjectId,
            nicknames: { user: memberObjectId },
          },
        },
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async leaveConversation({
    conversationId,
    memberId,
    newAdminId,
    isLastMember,
  }: {
    conversationId: string;
    memberId: string;
    newAdminId?: string;
    isLastMember: boolean;
  }) {
    const memberObjectId = new Types.ObjectId(memberId);
    const filter: Record<string, unknown> = {
      _id: conversationId,
      isGroupChat: true,
      members: memberObjectId,
      status: { $ne: ConversationStatus.DELETED },
    };
    const update: Record<string, Record<string, unknown>> = {
      $pull: { members: memberObjectId, nicknames: { user: memberObjectId } },
    };

    if (newAdminId) {
      filter.members = { $size: 2, $all: [memberObjectId] };
      filter.admins = [memberObjectId];
      update.$set = { admins: [new Types.ObjectId(newAdminId)] };
    } else if (isLastMember) {
      filter.members = { $size: 1, $all: [memberObjectId] };
      update.$pull.admins = memberObjectId;
      update.$set = { status: ConversationStatus.DELETED };
    } else {
      filter.$or = [{ admins: { $ne: memberObjectId } }, { "admins.1": { $exists: true } }];
      update.$pull.admins = memberObjectId;
    }

    try {
      const result = await this.Conversation.updateOne(filter, update);
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
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
    const memberObjectId = new Types.ObjectId(memberId);

    try {
      const result = await this.Conversation.updateOne(
        {
          _id: conversationId,
          $and: [{ admins: new Types.ObjectId(requesterId) }, { admins: memberObjectId }],
          "admins.1": { $exists: true },
          isGroupChat: true,
        },
        { $pull: { admins: memberObjectId } },
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async setPhoto(
    { conversationId, photoId, requesterId }: { conversationId: string; photoId: string; requesterId: string },
    session?: ClientSession,
  ) {
    try {
      const previous = await this.Conversation.findOneAndUpdate(
        {
          _id: conversationId,
          admins: new Types.ObjectId(requesterId),
          isGroupChat: true,
          status: { $ne: ConversationStatus.DELETED },
        },
        { $set: { photo: new Types.ObjectId(photoId) } },
        { session, projection: { photo: 1 } },
      );
      if (!previous) return { changed: false, previousPhotoId: null };

      return { changed: true, previousPhotoId: previous.photo ? String(previous.photo) : null };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getBlockedConversationsByUserId(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    try {
      return await this.Conversation.aggregate([
        { $match: { status: ConversationStatus.BLOCKED, blocker: userObjectId } },
        {
          $lookup: {
            from: "user",
            localField: "members",
            foreignField: "_id",
            as: "members",
            pipeline: [
              { $match: { _id: { $ne: userObjectId } } },
              {
                $lookup: {
                  from: "photo",
                  localField: "photo",
                  foreignField: "_id",
                  as: "photo",
                  pipeline: [{ $project: { url: 1 } }],
                },
              },
              { $set: { photo: { $ifNull: [{ $first: "$photo" }, null] } } },
              { $project: { userName: 1, displayName: 1, photo: 1 } },
            ],
          },
        },
        { $set: { blockedUser: { $first: "$members" } } },
        { $match: { blockedUser: { $ne: null } } },
        { $project: { blockedUser: 1, blocker: 1, lastUpdated: 1 } },
        { $sort: { lastUpdated: -1 } },
      ]);
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
            from: "user",
            localField: "members",
            foreignField: "_id",
            as: "members",
            pipeline: [
              { $project: { displayName: 1, photo: 1 } },
              {
                $lookup: {
                  from: "photo",
                  localField: "photo",
                  foreignField: "_id",
                  as: "photo",
                  pipeline: [{ $project: { url: 1 } }],
                },
              },
              { $set: { photoUrl: { $ifNull: [{ $first: "$photo.url" }, null] } } },
              { $unset: "photo" },
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
    const userFields = "email userName displayName photo status lastOnline";
    const userPopulate = { path: "photo", select: "url" };

    try {
      return await this.Conversation.findOne({ _id: conversationId }).populate([
        { path: "members", select: userFields, populate: userPopulate },
        { path: "admins", select: userFields, populate: userPopulate },
        { path: "photo", select: "url" },
      ]);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  /** Ids of every user who shares at least one conversation with the given user. */
  async getConversationPartnerIds(userId: string) {
    try {
      const memberIds = await this.Conversation.distinct("members", {
        members: new Types.ObjectId(userId),
      });
      return memberIds.map(String).filter((id) => id !== userId);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  /** Conversations with exactly these members; populated members leave out the requester. */
  async findConversationByMembers(members: string[], requesterId: string) {
    try {
      return await this.Conversation.aggregate([
        {
          $match: {
            isGroupChat: members.length > 2,
            members: {
              $size: members.length,
              $all: members.map((member) => new Types.ObjectId(member)),
            },
          },
        },
        {
          $lookup: {
            from: "user",
            localField: "members",
            foreignField: "_id",
            as: "members",
            pipeline: [
              { $match: { _id: { $ne: new Types.ObjectId(requesterId) } } },
              {
                $lookup: {
                  from: "photo",
                  localField: "photo",
                  foreignField: "_id",
                  as: "photo",
                  pipeline: [{ $project: { url: 1 } }],
                },
              },
              { $set: { photo: { $ifNull: [{ $first: "$photo" }, null] } } },
              { $project: { email: 1, userName: 1, displayName: 1, photo: 1, status: 1, lastOnline: 1 } },
            ],
          },
        },
      ]);
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
            from: "photo",
            localField: "photo",
            foreignField: "_id",
            as: "photo",
            pipeline: [{ $project: { url: 1 } }],
          },
        },
        { $set: { photo: { $ifNull: [{ $first: "$photo" }, null] } } },
        {
          $lookup: {
            from: "user",
            localField: "members",
            foreignField: "_id",
            as: "members",
            pipeline: [
              { $match: { _id: { $ne: new Types.ObjectId(userId) } } },
              {
                $lookup: {
                  from: "photo",
                  localField: "photo",
                  foreignField: "_id",
                  as: "photo",
                  pipeline: [{ $project: { url: 1 } }],
                },
              },
              { $set: { photo: { $ifNull: [{ $first: "$photo" }, null] } } },
              { $project: { status: 1, displayName: 1, photo: 1 } },
            ],
          },
        },
        {
          $lookup: {
            from: "message",
            localField: "_id",
            foreignField: "conversation",
            as: "messages",
            pipeline: [
              { $sort: { dateCreated: -1 } },
              { $limit: 1 },
              {
                $lookup: {
                  from: "user",
                  localField: "sender",
                  foreignField: "_id",
                  as: "sender",
                  pipeline: [{ $project: { displayName: 1 } }],
                },
              },
              {
                $set: {
                  sender: { $ifNull: [{ $first: "$sender" }, null] },
                  seenBy: { $map: { input: "$seenBy", as: "id", in: { _id: "$$id" } } },
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
        {
          $match: { members: { $in: [new Types.ObjectId(userObjectId)] }, status: { $ne: ConversationStatus.BLOCKED } },
        },
        {
          $lookup: {
            from: "user",
            localField: "members",
            foreignField: "_id",
            as: "members",
            pipeline: [
              { $match: { _id: { $ne: userObjectId } } },
              {
                $lookup: {
                  from: "photo",
                  localField: "photo",
                  foreignField: "_id",
                  as: "photo",
                  pipeline: [{ $project: { url: 1 } }],
                },
              },
              { $set: { photo: { $ifNull: [{ $first: "$photo" }, null] } } },
              { $project: { status: 1, displayName: 1, photo: 1 } },
            ],
          },
        },
        { $match: { "members.status": UserStatus.ONLINE } },
        {
          $lookup: {
            from: "photo",
            localField: "photo",
            foreignField: "_id",
            as: "photo",
            pipeline: [{ $project: { url: 1 } }],
          },
        },
        { $set: { photo: { $ifNull: [{ $first: "$photo" }, null] } } },
        { $project: { name: 1, isGroupChat: 1, photo: 1, members: 1, nicknames: 1, lastUpdated: 1 } },
        { $sort: { lastUpdated: -1 } },
      ]);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
