import { IsMongoId } from 'class-validator';

export class ProfilePhotoParamDto {
  @IsMongoId()
  photoId!: string;
}
