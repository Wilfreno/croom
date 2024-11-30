import { model, Schema, Types } from "mongoose";

export type MemberSchema = {
  user: Types.ObjectId;
  chat_room: Types.ObjectId;
  role: "MEMBER" | "ADMIN";
  date_created: Date;
  last_updated: Date;
};

const memberSchema = new Schema<MemberSchema>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  chat_room: {
    type: Schema.Types.ObjectId,
    ref: "ChatRoom",
    required: true,
  },
  role: {
    type: String,
    enum: ["MEMBER", "ADMIN"],
    required: true,
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
