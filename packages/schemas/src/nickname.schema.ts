import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<NickName>;

@Schema({ _id: false })
export class NickName {
  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  user!: string;

  @Prop({ type: String, required: true })
  members!: string;
}

export const NickNameSchema = SchemaFactory.createForClass(NickName);
