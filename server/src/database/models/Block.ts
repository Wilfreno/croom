import { model, Schema, Types } from "mongoose";

export type BlockSchema = {
  blocked_user: Types.ObjectId;
  blocker: Types.ObjectId;
  date_created: Date;
};

const blockSchema = new Schema<BlockSchema>({
  blocked_user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  blocker: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date_created: {
    type: Date,
    default: Date.now,
  },
});

blockSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

const Block = model("Block", blockSchema);

export default Block;
