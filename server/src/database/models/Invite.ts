import { model, Schema, Types } from "mongoose";

export type Invite = {
  lobby: Types.ObjectId;
  invited: Types.ObjectId[];
  token: string;
  expires_in: Date;
  date_created: Date;
  last_updated: Date;
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
  expires_in: {
    type: Date,
    default: null,
    expires: 0,
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

inviteSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

const Invite = model("Invite", inviteSchema);

export default Invite;
