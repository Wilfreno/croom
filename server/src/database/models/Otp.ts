import { model, Schema } from "mongoose";

export type OTPSchema = {
  email: string;
  pin: string;
  date_created: Date;
};

const otpSchema = new Schema<OTPSchema>(
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
      expires: 60 * 30,
    },
  },
  { versionKey: false }
);

const OTP = model("OTP", otpSchema);

export default OTP;
