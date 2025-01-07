import { Types, Schema, model } from "mongoose";

export type ReportSchema = {
  conversation: Types.ObjectId;
  submitted_by: Types.ObjectId;
  reported_user: Types.ObjectId;
  created_at: Date;
};

const ReportSchema = new Schema<ReportSchema>({
  conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
  submitted_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reported_user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  created_at: { type: Date, default: Date.now },
});

const Report = model("Report", ReportSchema);

export default Report;
