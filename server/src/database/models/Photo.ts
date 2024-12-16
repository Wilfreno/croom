import { model, Schema, Types } from "mongoose";

export type PhotoSchema = {
  owner: Types.ObjectId;
  type: "PROFILE" | "CONVERSATION" | "MESSAGE";
  url: string;
  width: number;
  height: number;
  date_created: Date;
};

const photoSchema = new Schema<PhotoSchema>({
  owner: {
    type: Schema.Types.ObjectId,
  },
  type: {
    type: String,
    enum: ["PROFILE", "MESSAGE", "CONVERSATION"],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    default: null,
  },
  height: {
    type: Number,
    default: null,
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
