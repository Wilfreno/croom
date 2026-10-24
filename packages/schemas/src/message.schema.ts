import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MessageStatus } from '@repo/enums';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<Message>;

@Schema({ collection: 'message' })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversation!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender!: string;

  @Prop({ type: String, default: '' })
  text!: string;

  @Prop({ type: [Types.ObjectId], ref: 'Photo', default: [] })
  photos!: Types.ObjectId[];

  @Prop({ type: String, enum: MessageStatus, default: null })
  status!: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  seenBy!: Types.ObjectId[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
