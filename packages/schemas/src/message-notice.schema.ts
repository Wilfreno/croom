import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MessageNoticeType } from '@repo/enums';
import { HydratedDocument, Types } from 'mongoose';

export type MessageNoticeDocument = HydratedDocument<MessageNotice>;

@Schema({ _id: false })
export class MessageNotice {
  @Prop({ type: String, enum: MessageNoticeType, required: true })
  type!: MessageNoticeType;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ type: String, default: '' })
  value!: string;
}

export const MessageNoticeSchema = SchemaFactory.createForClass(MessageNotice);
