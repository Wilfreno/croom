import { model, Schema, Types } from "mongoose";

export type MessageSchema = {
  conversation: Types.ObjectId;
  status: "DELETED" | "UPDATED";
  sender: Types.ObjectId;
  text: string;
  photos: Types.ObjectId[];
  seen_by: Types.ObjectId[];
  date_created: Date;
  last_updated: Date;
};

const messageSchema = new Schema<MessageSchema>({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    default: "",
  },
  photos: [
    {
      type: Schema.Types.ObjectId,
      ref: "Photo",
      default: [],
    },
  ],
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
