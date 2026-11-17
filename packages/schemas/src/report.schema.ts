import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { REPORT_REASON_MAX_LENGTH } from '@repo/constants';
import { HydratedDocument, Types } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

@Schema({
  collection: 'report',
  timestamps: { createdAt: 'dateCreated', updatedAt: false },
})
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporter!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reportedUser!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversation!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: REPORT_REASON_MAX_LENGTH })
  reason!: string;

  @Prop({ type: Date, immutable: true })
  dateCreated!: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

ReportSchema.index({ reportedUser: 1, dateCreated: -1 });
