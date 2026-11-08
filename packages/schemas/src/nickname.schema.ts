import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NickNameDocument = HydratedDocument<NickName>;

@Schema({ _id: false })
export class NickName {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ type: String, default: '' })
  value!: string;
}

export const NickNameSchema = SchemaFactory.createForClass(NickName);
