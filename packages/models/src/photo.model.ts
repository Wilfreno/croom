import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Photo } from '@repo/schemas';
import { ClientSession, Model } from 'mongoose';

@Injectable()
export class PhotoModel {
  private readonly logger = new Logger(PhotoModel.name);

  constructor(@InjectModel(Photo.name) private Photo: Model<Photo>) {}

  async createMany(photos: Partial<Photo>[], session: ClientSession) {
    try {
      const newPhotos = await this.Photo.create(photos, { session });

      return newPhotos.map((photo) => photo.toJSON());
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
