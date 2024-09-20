import { model, Schema, Types } from "mongoose";

export type Lobby = {
  participants: Types.ObjectId[];
  name: string;
  is_group_chat: boolean;
  messages: Types.ObjectId[];
  date_created: Date;
};

const lobbySchema = new Schema<Lobby>({
  participants: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  name: {
    type: String,
    required: true,
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
