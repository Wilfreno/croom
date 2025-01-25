import { ValidatorProps } from "mongoose";
import { model, Schema, Types } from "mongoose";

export type UserSchema = {
  display_name: string;
  username: string;
  password?: string;
  email: string;
  status: "OFFLINE" | "ONLINE";
  photo: Types.ObjectId;
  conversations: Types.ObjectId[];
  blocked: Types.ObjectId[];
  last_online: Date;
  date_created: Date;
  last_updated: Date;
};

const userSchema = new Schema<UserSchema>({
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
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: (props: ValidatorProps) => `${props.value} is not a valid email address!`,
    },
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
  conversations: [
    {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      default: [],
    },
  ],
  blocked: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: [],
    },
  ],
  last_online: {
    type: Date,
    default: Date.now,
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

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id?.toString();
    delete ret._id;
  },
});

const User = model("User", userSchema);

export default User;
