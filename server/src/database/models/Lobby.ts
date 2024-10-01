import { model, Schema, Types } from "mongoose";

export type Lobby = {
  members: Types.ObjectId[];
  is_private: boolean;
  name: string;
  messages: Types.ObjectId[];
  photo: Types.ObjectId;
  date_created: Date;
  last_updated: Date;
};

const lobbySchema = new Schema<Lobby>({
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "Member",
      default: [],
    },
  ],
  name: {
    type: String,
    default: "",
  },
  is_private: {
    type: Boolean,
    default: true,
  },
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
