import { model, Schema, Types } from "mongoose";

export type Member = {
  user: Types.ObjectId;
  lobby: Types.ObjectId;
  role: "ADMIN" | "MEMBER";
  date_created: Date;
  last_updated: Date;
};

const memberSchema = new Schema<Member>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lobby: {
    type: Schema.Types.ObjectId,
    ref: "Lobby",
    required: true,
  },
  role: {
    type: String,
    enum: ["ADMIN", "MEMBER"],
    default: "MEMBER",
  },
  date_created: {
    type: Date,
    default: Date.now,
  },
  last_updated: {
    type: Date,
    default: Date.now,
  },
});

memberSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

const Member = model("Member", memberSchema);

export default Member;
