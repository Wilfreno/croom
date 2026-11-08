import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

export class MessagePhotoDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsUrl()
  url!: string;

  @IsInt()
  @IsPositive()
  width!: number;

  @IsInt()
  @IsPositive()
  height!: number;
}

export class CreateMessageDto {
  @IsString()
  text!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessagePhotoDto)
  photos!: MessagePhotoDto[];

  @IsMongoId()
  conversationId!: string;
}
