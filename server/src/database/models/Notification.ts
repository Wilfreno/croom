import { model, Schema, Types } from "mongoose";

export type Notification = {
  lobby: Types.ObjectId;
  receiver: Types.ObjectId;
  type: "MESSAGE" | "INVITE";
  invite: Types.ObjectId;
  date_created: Date;
  last_updated: Date;
};

const notificationSchema = new Schema<Notification>({
  lobby: {
    type: Schema.Types.ObjectId,
    ref: "Lobby",
    required: true,
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  type: {
    type: String,
    enum: ["MESSAGE", "INVITE"],
    required: true,
  },
  invite: {
    type: Schema.Types.ObjectId,
    ref: "Invite",
    default: null,
  },
  last_updated: {
    type: Date,
    default: Date.now,
  },
  date_created: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

const Notification = model("Notification", notificationSchema);

export default Notification;
