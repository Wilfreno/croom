import { model, Schema, Types } from "mongoose";

export type User = {
  display_name: string;
  username: string;
  password?: string;
  status: "OFFLINE" | "ONLINE";
  photo: Types.ObjectId;
  is_new: boolean;
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

  display_name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    default: null,
  },
  is_new: {
    type: Boolean,
    default: true,
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
