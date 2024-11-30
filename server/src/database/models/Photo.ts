import { model, Schema, Types } from "mongoose";

export type PhotoSchema = {
  owner: Types.ObjectId;
  type: "PROFILE" | "CHAT_ROOM" | "MESSAGE";
  url: string;
  date_created: Date;
};

const photoSchema = new Schema<PhotoSchema>({
  owner: {
    type: Schema.Types.ObjectId,
  },
  type: {
    type: String,
    enum: ["PROFILE", "MESSAGE", "CHAT_ROOM"],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  date_created: {
    type: Date,
    default: Date.now,
  },
});

photoSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

const Photo = model("Photo", photoSchema);

export default Photo;
