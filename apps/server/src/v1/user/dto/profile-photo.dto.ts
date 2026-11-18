import { Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

export class UploadedProfilePhotoDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsUrl()
  url!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  width?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  height?: number;
}

export class ChangeProfilePhotoDto {
  @ValidateNested()
  @Type(() => UploadedProfilePhotoDto)
  photo!: UploadedProfilePhotoDto;
}

export class ProfilePhotoParamDto {
  @IsMongoId()
  photoId!: string;
}
