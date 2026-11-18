import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PhotoType } from '@repo/enums';
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
      const newPhotos = await this.Photo.create(photos, { session, ordered: true });

      return newPhotos.map((photo) => photo.toJSON());
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async deleteById(photoId: string, session?: ClientSession) {
    try {
      await this.Photo.deleteOne({ _id: photoId }, { session });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getProfilePhotosByOwnerId(ownerId: string) {
    try {
      return await this.Photo.find({ owner: ownerId, type: PhotoType.PROFILE })
        .sort({ lastUpdated: -1 })
        .select('url width height lastUpdated')
        .lean();
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async findProfilePhoto({ photoId, ownerId }: { photoId: string; ownerId: string }) {
    try {
      return await this.Photo.findOne({ _id: photoId, owner: ownerId, type: PhotoType.PROFILE })
        .select('url')
        .lean();
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async markAsRecent(photoId: string, session?: ClientSession) {
    try {
      const result = await this.Photo.updateOne({ _id: photoId }, { $set: { lastUpdated: new Date() } }, { session });

      return result.matchedCount > 0;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async deleteProfilePhoto({ photoId, ownerId }: { photoId: string; ownerId: string }, session?: ClientSession) {
    try {
      const result = await this.Photo.deleteOne({ _id: photoId, owner: ownerId, type: PhotoType.PROFILE }, { session });

      return result.deletedCount > 0;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async deleteProfilePhotosBeyond({ ownerId, keep }: { ownerId: string; keep: number }, session?: ClientSession) {
    try {
      const extraPhotos = await this.Photo.find({ owner: ownerId, type: PhotoType.PROFILE })
        .sort({ lastUpdated: -1 })
        .skip(keep)
        .select('_id')
        .session(session ?? null)
        .lean();

      if (extraPhotos.length === 0) return;

      const extraPhotoIds = extraPhotos.map((photo) => photo._id);
      await this.Photo.deleteMany({ _id: { $in: extraPhotoIds } }, { session });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async deleteProfilePhotosByOwnerId(ownerId: string, session?: ClientSession) {
    try {
      await this.Photo.deleteMany({ owner: ownerId, type: PhotoType.PROFILE }, { session });
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
