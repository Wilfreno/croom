import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MessageStatus } from '@repo/enums';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({
  collection: 'message',
  timestamps: { createdAt: 'dateCreated', updatedAt: 'lastUpdated' },
})
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversation!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender!: Types.ObjectId;

  @Prop({ type: String, default: '' })
  text!: string;

  @Prop({ type: [Types.ObjectId], ref: 'Photo', default: [] })
  photos!: Types.ObjectId[];

  @Prop({ type: String, enum: MessageStatus, default: null })
  status!: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  seenBy!: Types.ObjectId[];

  @Prop({ type: Date, immutable: true })
  dateCreated!: Date;

  @Prop({ type: Date })
  lastUpdated!: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
