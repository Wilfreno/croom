import { model, Schema } from "mongoose";

export type OTP = {
  email: string;
  pin: string;
  date_created: Date;
};

const otpSchema = new Schema<OTP>(
  {
    email: {
      type: String,
      required: true,
    },
    pin: {
      type: String,
      required: true,
    },
    date_created: {
      type: Date,

      default: Date.now,
    },
  },
  { versionKey: false }
);

const OTP = model("OTP", otpSchema);

export default OTP;
