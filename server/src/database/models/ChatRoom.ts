import { model, Schema, Types } from "mongoose";

export type ChatRoomSchema = {
  name: string;
  is_private: boolean;
  members: Types.ObjectId[];
  messages: Types.ObjectId[];
  photo: Types.ObjectId;
  date_created: Date;
  last_updated: Date;
};

const chatRoomSchema = new Schema<ChatRoomSchema>({
  name: {
    type: String,
    default: "",
  },
  is_private: {
    type: Boolean,
    default: true,
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "Member",
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

chatRoomSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

const ChatRoom = model("ChatRoom", chatRoomSchema);

export default ChatRoom;
