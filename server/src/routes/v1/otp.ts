import "dotenv/config";
import { createTransport } from "nodemailer";
import { render } from "@react-email/components";
import JSONResponse from "../../lib/json-response";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import OTPEmail from "../../lib/email/Otp";
import OTP, { type OTP as OTPType } from "../../database/models/Otp";
export default function v1OTPRouter(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  const gmail_password = process.env.GMAIL_2F_AUTH_APP_PASS;
  if (!gmail_password)
    throw new Error("GMAIL_2F_AUTH_APP_PASS is missing from your .env file");

  fastify.post<{ Body: { email: string } }>("/", async (request, reply) => {
    try {
      const { email } = request.body;

      if (!email)
        return reply
          .code(400)
          .send(
            JSONResponse(
              "BAD_REQUEST",
              "email field is required on the request body"
            )
          );

      const transport = createTransport({
        port: 465,
        secure: true,
        service: "gmail",
        auth: {
          user: "chatup.dev.noreply@gmail.com",
          pass: gmail_password,
        },
      });

      const verify = await transport.verify();

      if (!verify)
        reply
          .code(500)
          .send(
            JSONResponse(
              "INTERNAL_SERVER_ERROR",
              "email transport verify failed"
            )
          );

      const chars = "abcdefghijklmnopqrstuvwxyz1234567890";
      let random_string = "";

      for (let i = 0; i < 6; i++) {
        random_string += chars[Math.floor(Math.random() * chars.length)];
      }

      const otp = new OTP({
        email: email,
        pin: random_string.toUpperCase(),
      });
      otp.save();

      const html = await render(
        OTPEmail({
          username: email.substring(0, email.indexOf("@")),
          code: random_string,
        })
      );

      await transport.sendMail(
        {
          from: "chatup.dev.noreply@gmail.com",
          to: email,
          subject:
            "welcome to Chat Up your verification code is " +
            random_string.toLocaleUpperCase(),
          html,
        },
        (error) => {
          if (error)
            return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
        }
      );

      return reply
        .code(201)
        .send(JSONResponse("CREATED", "OTP verification code is sent"));
    } catch (error) {
      console.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  fastify.post<{ Body: OTPType }>("/authenticate", async (request, reply) => {
    try {
      const { pin, email } = request.body;
      if (!pin || !email)
        return reply
          .code(400)
          .send(
            JSONResponse(
              "BAD_REQUEST",
              "otp and email field is required on the request body"
            )
          );

      const found_otp = await OTP.findOne({ email, pin });

      if (!found_otp)
        return reply
          .code(401)
          .send(JSONResponse("UNAUTHORIZED", "otp is incorrect"));

      await OTP.deleteMany({ email });
      return reply.code(200).send(JSONResponse("OK", "otp verified"));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  done();
}
