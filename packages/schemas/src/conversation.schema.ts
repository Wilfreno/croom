import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ConversationStatus } from '@repo/enums';
import { HydratedDocument, Types } from 'mongoose';
import { NickName, NickNameSchema } from './nickname.schema';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({
  collection: 'conversation',
  timestamps: { createdAt: 'dateCreated', updatedAt: 'lastUpdated' },
})
export class Conversation {
  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  members!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  admins!: Types.ObjectId[];

  @Prop({ type: [NickNameSchema], default: [] })
  nicknames!: NickName[];

  @Prop({ type: Types.ObjectId, ref: 'Photo', default: null })
  photo!: Types.ObjectId;

  @Prop({ type: String, enum: ConversationStatus })
  status?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: function (this: Conversation) {
      return this.status === ConversationStatus.BLOCKED;
    },
  })
  blocker: Types.ObjectId;

  @Prop({ type: Date, immutable: true })
  dateCreated!: Date;

  @Prop({ type: Date })
  lastUpdated!: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
