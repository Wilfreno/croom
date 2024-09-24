import { model, Schema, Types } from "mongoose";

export type Invite = {
  lobby: Types.ObjectId;
  invited: Types.ObjectId[];
  token: string;
  expires_in: "30_MIN" | "1D" | "1W" | "1M" | "NEVER";
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
  expires_in: {
    type: String,
    enum: ["30_MIN", "1D", "1W", "1M", "NEVER"],
    default: "30_MIN",
  },
  date_created: {
    typed: Date,
    default: Date.now,
  },
});

inviteSchema.pre("save", async function (next) {
  let seconds;
  switch (this.expires_in) {
    case "30_MIN":
      seconds = 30 * 60;
      break;
    case "1D":
      seconds = 24 * 60 * 60;
      break;
    case "1W":
      seconds = 7 * 24 * 60 * 60;
      break;
    case "1M":
      seconds = 30 * 24 * 60 * 60;
      break;
    case "NEVER":
      seconds = null;
  }
  this.schema.path("date_created").options.expires = seconds;

  next();
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
