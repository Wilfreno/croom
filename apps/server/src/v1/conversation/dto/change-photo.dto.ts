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

export class ChangePhotoParamDto {
  @IsMongoId()
  conversationId!: string;
}

export class ConversationPhotoDto {
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

export class ChangePhotoDto {
  @ValidateNested()
  @Type(() => ConversationPhotoDto)
  photo!: ConversationPhotoDto;
}
