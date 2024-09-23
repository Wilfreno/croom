import { model, Schema, Types } from "mongoose";

export type Invite = {
  lobby: Types.ObjectId;
  invited: Types.ObjectId[];
  token: string;
  date_created: Date;
};

const inviteSchema = new Schema<Invite>({
  lobby: {
    type: Schema.Types.ObjectId,
    ref: "Lobby",
    required: true,
  },
  invited: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: [],
    },
  ],
  token: {
    type: String,
    required: true,
  },
  date_created: {
    typed: Date,
    default: Date.now,
  },
});

const Invite = model("Invite", inviteSchema);

export default Invite;
