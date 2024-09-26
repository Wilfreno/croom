import { model, Schema, Types } from "mongoose";

export type Message = {
  lobby: Types.ObjectId;
  type: "TEXT";
  status: "DELETED" | "UPDATED";
  sender: Types.ObjectId;
  text: string;
  seen_by: Types.ObjectId[];
  date_created: Date;
  last_updated: Date;
};

const messageSchema = new Schema<Message>({
  lobby: {
    type: Schema.Types.ObjectId,
    ref: "Lobby",
    required: true,
  },
  type: {
    type: String,
    enum: ["TEXT"],
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["DELETED", "UPDATED"],
    default: null,
  },
  seen_by: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: [],
    },
  ],
  date_created: {
    type: Date,
    default: Date.now,
  },
  last_updated: {
    type: Date,
    default: Date.now,
  },
});

messageSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

const Message = model("Message", messageSchema);

export default Message;
