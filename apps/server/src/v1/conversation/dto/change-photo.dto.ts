import { IsMongoId } from 'class-validator';

export class ChangePhotoParamDto {
  @IsMongoId()
  conversationId!: string;
}

export class ChangePhotoDto {
  @IsMongoId()
  photoId!: string;
}
