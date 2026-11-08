import { MessageSchema } from '@repo/schemas';
import type { MessageFieldName } from '@repo/types';
import { IsIn, IsMongoId } from 'class-validator';

export const messageFieldNames = Object.keys(MessageSchema.paths).filter(
  (path) => path !== '_id' && path !== '__v',
) as MessageFieldName[];

export class SeenByDto {
  @IsMongoId()
  messageId!: string;

  @IsIn(messageFieldNames)
  fieldName!: MessageFieldName;
}
