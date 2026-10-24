import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { NickNameSchema } from './nickname.schema';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ collection: 'conversation' })
export class Conversation {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  members!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  admins!: Types.ObjectId[];

  @Prop({ type: [NickNameSchema], default: [] })
  nicknames!: (typeof NickNameSchema)[];

  @Prop({ type: [Types.ObjectId], ref: 'Message', default: [] })
  messages!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Photo', default: null })
  photo!: Types.ObjectId;

  @Prop({ type: Date, required: false, default: Date.now })
  dateCreated!: Date;

  @Prop({ type: Date, required: false, default: Date.now })
  lastUpdated!: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
