import { Types, Schema, model } from "mongoose";

export type ReportSchema = {
  submitted_by: Types.ObjectId;
  reported_user: Types.ObjectId;
  reason: string;
  created_at: Date;
};

const ReportSchema = new Schema<ReportSchema>({
  submitted_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reported_user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

const Report = model("Report", ReportSchema);

export default Report;
