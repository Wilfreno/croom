import { model, Schema, Types } from "mongoose";

export type ConversationSchema = {
  name: string;
  is_private: boolean;
  is_group_chat: boolean;
  admins: Types.ObjectId[];
  members: Types.ObjectId[];
  messages: Types.ObjectId[];
  photo: Types.ObjectId;
  date_created: Date;
  last_updated: Date;
};

const conversationSchema = new Schema<ConversationSchema>({
  name: {
    type: String,
    default: "",
  },
  is_private: {
    type: Boolean,
    default: true,
  },
  is_group_chat: {
    type: Boolean,
    default: false,
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: [],
    },
  ],
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: [],
    },
  ],
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: [],
    },
  ],
  photo: {
    type: Schema.Types.ObjectId,
    ref: "Photo",
    default: null,
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

conversationSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

const Conversation = model("Conversation", conversationSchema);

export default Conversation;
