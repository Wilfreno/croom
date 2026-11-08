import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MessageStatus } from '@repo/enums';
import { Message } from '@repo/schemas';
import type { MessagePayload } from '@repo/types';
import { ClientSession, HydratedDocument, Model, Types, UpdateQuery } from 'mongoose';

@Injectable()
export class MessageModel {
  private readonly logger = new Logger(MessageModel.name);

  constructor(@InjectModel(Message.name) private Message: Model<Message>) {}

  async createMessage(data: Partial<Message>, session: ClientSession) {
    try {
      const newMessage = new this.Message(data);

      await newMessage.save({ session });

      return newMessage.toJSON();
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async findMessagePayloadById(messageId: Types.ObjectId | string): Promise<MessagePayload | null> {
    // Swaps `_id` for a string `id` (and drops `__v`) on the current document.
    const toEntity = [{ $set: { id: { $toString: '$_id' } } }, { $unset: ['_id', '__v'] }];

    try {
      const [message] = await this.Message.aggregate<MessagePayload>([
        { $match: { _id: new Types.ObjectId(messageId) } },
        { $limit: 1 },
        {
          $lookup: {
            from: 'user',
            localField: 'sender',
            foreignField: '_id',
            as: 'sender',
            pipeline: [
              // Aggregation ignores the schema's `select: false`, so drop the password here.
              { $unset: 'password' },
              {
                $lookup: {
                  from: 'photo',
                  localField: 'photo',
                  foreignField: '_id',
                  as: 'photo',
                  pipeline: toEntity,
                },
              },
              { $set: { photo: { $ifNull: [{ $first: '$photo' }, null] } } },
              ...toEntity,
            ],
          },
        },
        { $set: { sender: { $first: '$sender' } } },
        {
          $lookup: {
            from: 'photo',
            localField: 'photos',
            foreignField: '_id',
            as: 'photos',
            pipeline: toEntity,
          },
        },
        {
          $lookup: {
            from: 'conversation',
            localField: 'conversation',
            foreignField: '_id',
            as: 'conversation',
            pipeline: [
              {
                $project: {
                  _id: 0,
                  id: { $toString: '$_id' },
                  nicknames: {
                    $map: {
                      input: '$nicknames',
                      as: 'nickname',
                      in: { user: { $toString: '$$nickname.user' }, value: '$$nickname.value' },
                    },
                  },
                },
              },
            ],
          },
        },
        { $set: { conversation: { $first: '$conversation' } } },
        ...toEntity,
      ]);

      return message ?? null;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getMessagesByConversationId({
    conversationId,
    skip,
    limit,
  }: {
    conversationId: string;
    skip: number;
    limit: number;
  }) {
    try {
      return await this.Message.aggregate<Message>([
        { $match: { conversation: new Types.ObjectId(conversationId) } },
        { $sort: { dateCreated: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'user',
            localField: 'sender',
            foreignField: '_id',
            as: 'sender',
            pipeline: [
              { $project: { photo: 1 } },
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
            ],
          },
        },
        { $set: { sender: { $ifNull: [{ $first: '$sender' }, null] } } },
        {
          $lookup: {
            from: 'photo',
            localField: 'photos',
            foreignField: '_id',
            as: 'photos',
            pipeline: [{ $project: { url: 1, height: 1, width: 1 } }],
          },
        },
        { $sort: { dateCreated: 1 } },
      ]);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async checkMessageAvailability(messageId: string) {
    let foundMessage: HydratedDocument<Message>;

    try {
      foundMessage = await this.Message.findOne({ _id: messageId });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
    if (!foundMessage) throw new NotFoundException('Message does not exist');
    if (foundMessage.status === MessageStatus.DELETED)
      throw new ConflictException('Cannot Update; the message has been deleted');
    return foundMessage.toJSON();
  }

  async updateMessage(messageId: string, data: UpdateQuery<Message>) {
    let result: Awaited<ReturnType<Model<Message>['updateOne']>>;

    try {
      result = await this.Message.updateOne({ _id: messageId }, data);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }

    if (result.matchedCount === 0) throw new NotFoundException('Message does not exist');

    return result;
  }
}
