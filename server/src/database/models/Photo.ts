import { model, Schema, Types } from "mongoose";

export type Photo = {
  owner: Types.ObjectId;
  type: "PROFILE";
  url: string;
  date_created: Date;
};

const photoSchema = new Schema<Photo>({
  owner: {
    type: Schema.Types.ObjectId,
  },
  type: {
    type: String,
    enum: ["PROFILE"],
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
