import { InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Photo } from '@repo/schemas';
import { ClientSession, Model } from 'mongoose';

export class PhotoModel {
  private readonly logger = new Logger(PhotoModel.name);

  constructor(@InjectModel(PhotoModel.name) private Photo: Model<PhotoModel>) {}

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
