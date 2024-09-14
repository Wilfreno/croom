import { model, Schema, Types } from "mongoose";

export type User = {
  username: string;
  password?: string;
  status: "OFFLINE" | "ONLINE";
  photo: Types.ObjectId;
  date_created: Date;
  last_updated: Date;
};

const userSchema = new Schema<User>({
  username: {
    type: String,
    required: true,
    unique: true,
    match: [/^@/, "username must start with @"],
  },

  password: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ["OFFLINE", "ONLINE"],
    default: "OFFLINE",
  },
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
    required: true,
  },
});

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

const User = model("User", userSchema);

export default User;
