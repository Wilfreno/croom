import { ArrayNotEmpty, IsArray, IsMongoId } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  members!: string[];
}
