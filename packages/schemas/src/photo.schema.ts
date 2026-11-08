import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PhotoType } from '@repo/enums';
import { HydratedDocument, Types } from 'mongoose';

export type PhotoDocument = HydratedDocument<Photo>;

@Schema({
  collection: 'photo',
  timestamps: { createdAt: 'dateCreated', updatedAt: 'lastUpdated' },
})
export class Photo {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner!: Types.ObjectId;

  @Prop({ type: String, enum: PhotoType, required: true })
  type!: string;

  @Prop({ type: String, required: true })
  key!: string;

  @Prop({ type: String, required: true })
  url!: string;

  @Prop({ type: Number, default: null })
  width!: number;

  @Prop({ type: Number, default: null })
  height!: number;

  @Prop({ type: Date, immutable: true })
  dateCreated!: Date;

  @Prop({ type: Date })
  lastUpdated!: Date;
}

export const PhotoSchema = SchemaFactory.createForClass(Photo);
