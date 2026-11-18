import { IsMongoId } from 'class-validator';

export class PendingPhotoParamDto {
  @IsMongoId()
  photoId!: string;
}
