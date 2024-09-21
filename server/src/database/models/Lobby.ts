import { model, Schema, Types } from "mongoose";

export type Lobby = {
  members: Types.ObjectId[];
  is_private: boolean;
  name: string;
  is_group_chat: boolean;
  messages: Types.ObjectId[];
  date_created: Date;
};

const lobbySchema = new Schema<Lobby>({
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  name: {
    type: String,
    default: null,
  },
  is_private: {
    type: Boolean,
    default: true,
  },
  is_group_chat: {
    type: Boolean,
    required: true,
  },
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: [],
    },
  ],
  date_created: {
    type: Date,
    default: Date.now,
  },
});

lobbySchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

const Lobby = model("Lobby", lobbySchema);

export default Lobby;
