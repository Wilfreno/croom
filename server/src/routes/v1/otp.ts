import { render } from "@react-email/components";
import { hash } from "bcrypt";
import { Router } from "express";
import { createTransport } from "nodemailer";
import OTPEmail from "../../lib/email/OTP";
import { badRequest, okStatus } from "../../lib/response-json";
import { prisma } from "../../server";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router.post("/", async (request, response) => {
  const gmail_password = process.env.GMAIL_2FAUTH_APP_PASS;
  if (!gmail_password)
    throw new Error("GMAIL_2FAUTH_APP_PASS is missing from your .env file");
  try {
    const { email } = await request.body;

    const transport = createTransport({
      service: "gmail",
      auth: {
        user: "croom.dev@gmail.com",
        pass: gmail_password,
      },
    });

    const verify = await transport.verify();

    if (!verify) throw new Error("transport verify failed");

    const chars = await hash(email, 5);
    let random_string = "";

    for (let i = 0; i < 6; i++) {
      random_string += chars[Math.floor(Math.random() * chars.length)];
    }
    random_string = random_string.replaceAll(".", chars[2]);
    await prisma.otp.create({
      data: {
        email,
        value: random_string.toUpperCase(),
      },
    });

    const at_index = email.indexOf("@");
    const user_name = email.substring(0, at_index);

    const html = render(OTPEmail({ user_name, otp: random_string }));

    transport.sendMail(
      {
        from: "croom.dev@gmail.com",
        to: email,
        subject:
          "Welcome to Croom your verification code is " +
          random_string.toUpperCase(),
        html,
      },
      (error, info) => {
        if (error) throw new Error(JSON.stringify(info));
      }
    );
    return response.status(200).json(okStatus("OTP created", null));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});

const v1_otp = router;

export default v1_otp;
