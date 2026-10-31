import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Message, Photo, User } from '@repo/schemas';
import { MessagePayload, PhotoPayload } from '@repo/types';
import { ClientSession, Model, Types } from 'mongoose';

type LeanPhoto = Photo & { _id: Types.ObjectId };
type LeanUser = User & { _id: Types.ObjectId; __v?: number };

@Injectable()
export class MessageModel {
  private readonly logger = new Logger(MessageModel.name);

  constructor(@InjectModel(Message.name) private Message: Model<Message>) {}

  private toPhotoPayload({ _id, ...photo }: LeanPhoto): PhotoPayload {
    return { ...photo, _id: _id.toString() };
  }
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
    try {
      const message = await this.Message.findById(messageId)
        .populate<{
          sender: LeanUser & { photo: LeanPhoto | null };
          photos: LeanPhoto[];
        }>([{ path: 'sender', populate: { path: 'photo' } }, { path: 'photos' }])
        .lean();

      if (!message) return null;

      const { _id, sender, photos, ...rest } = message;
      const { _id: senderId, __v, password, photo, ...senderRest } = sender;

      return {
        ...rest,
        _id: _id.toString(),
        sender: {
          ...senderRest,
          id: senderId.toString(),
          photo: photo ? this.toPhotoPayload(photo) : null,
        },
        photos: photos.map(this.toPhotoPayload),
      };
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
      ]);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
