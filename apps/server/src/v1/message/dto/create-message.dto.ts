import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsMongoId,
  IsPositive,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class MessagePhotoDto {
  @IsMongoId()
  id!: string;

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

  /** Set on every message except the first; see `members`. */
  @ValidateIf((dto: CreateMessageDto) => dto.members === undefined)
  @IsMongoId()
  conversationId?: string;

  /**
   * First message only, sent instead of `conversationId`: the other members
   * (not the sender). The conversation is created with the message.
   */
  @ValidateIf((dto: CreateMessageDto) => dto.conversationId === undefined)
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  members?: string[];
}
