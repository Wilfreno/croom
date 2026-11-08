import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Message as MessageSchema, Photo } from '@repo/schemas';
import type { Message } from '@repo/types';
import { ClientSession, Model, Types } from 'mongoose';
import { toEntity } from './pipeline';

@Injectable()
export class PhotoModel {
  private readonly logger = new Logger(PhotoModel.name);

  constructor(
    @InjectModel(Photo.name) private Photo: Model<Photo>,
    @InjectModel(MessageSchema.name) private Message: Model<MessageSchema>,
  ) {}

  async createMany(photos: Partial<Photo>[], session: ClientSession) {
    try {
      const newPhotos = await this.Photo.create(photos, { session });

      return newPhotos.map((photo) => photo.toJSON());
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  /**
   * Every message in the conversation that carries photos, newest first, with its photos and sender
   * resolved. Photos only link to a conversation through `message.photos`, so this runs on `message`.
   */
  async getPhotosByConversationId(conversationId: string) {
    try {
      return await this.Message.aggregate<Message>([
        { $match: { conversation: new Types.ObjectId(conversationId), 'photos.0': { $exists: true } } },
        { $sort: { dateCreated: -1 } },
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
            from: 'user',
            localField: 'sender',
            foreignField: '_id',
            as: 'sender',
            pipeline: [
              {
                $lookup: {
                  from: 'photo',
                  localField: 'photo',
                  foreignField: '_id',
                  as: 'photo',
                  pipeline: [{ $project: { url: 1 } }, ...toEntity],
                },
              },
              { $set: { photo: { $ifNull: [{ $first: '$photo' }, null] } } },
              { $project: { userName: 1, displayName: 1, status: 1, photo: 1 } },
              ...toEntity,
            ],
          },
        },
        { $set: { sender: { $first: '$sender' }, conversation: { $toString: '$conversation' } } },
        ...toEntity,
      ]);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
