import passport from "@fastify/passport";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import JSONResponse from "../../lib/json-response";
import { ClientSession, startSession } from "mongoose";
import User, { UserSchema } from "../../database/models/User";
import { hash } from "bcrypt";
import exclude from "../../lib/exclude";
import OTP from "../../database/models/Otp";
import { preValidation } from "../../lib/middleware";

export default async function v1AuthRouter(fastify: FastifyInstance, _: FastifyPluginOptions) {
  let client_url_origin;

  if (process.env.NODE_ENV === "production") {
    client_url_origin = process.env.CLIENT_PRODUCTION_ORIGIN;
    if (!client_url_origin) throw new Error("CLIENT_PRODUCTION_ORIGIN is missing from your .env file");
  } else {
    client_url_origin = process.env.CLIENT_DEVELOPMENT_ORIGIN;
    if (!client_url_origin) throw new Error("CLIENT_DEVELOPMENT_ORIGIN is missing from your .env file");
  }

  fastify.post<{
    Body: {
      username: string;
      password: string;
      email: string;
      display_name: string;
      pin: string;
    };
  }>("/signup", async (request, reply) => {
    let session: ClientSession | null = null;
    try {
      const { username, display_name, password, email, pin } = request.body;

      if (!pin)
        return reply.code(400).send(JSONResponse("BAD_REQUEST", "otp and email field is required on the request body"));

      if (!username)
        return reply.code(400).send(JSONResponse("BAD_REQUEST", "username is required on the request body"));
      if (!email) return reply.code(400).send(JSONResponse("BAD_REQUEST", "email is required on the request body"));

      if (await User.exists({ email })) return reply.code(400).send(JSONResponse("BAD_REQUEST", "email already used"));

      if (!username.startsWith("@"))
        return reply.code(400).send(JSONResponse("BAD_REQUEST", "username must start with @"));

      if (await User.exists({ username })) return reply.code(409).send(JSONResponse("CONFLICT", "user already exist"));

      if (!(await OTP.exists({ email, pin })))
        return reply.code(401).send(JSONResponse("UNAUTHORIZED", "otp is incorrect"));

      session = await startSession();
      session.startTransaction();

      await OTP.deleteMany({ email }, { session });

      const new_user = new User({
        display_name,
        username: username.toLowerCase(),
        password: await hash(password, 14),
        email,
        last_updated: new Date(),
      });

      await new_user.save({ session });

      await session.commitTransaction();
      await session.endSession();

      await request.logIn(exclude(new_user.toJSON(), ["password"]));

      return reply.code(201).send(JSONResponse("CREATED", "new user created"));
    } catch (error) {
      await session?.abortTransaction();
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  fastify.post("/local/login", passport.authenticate("local"));
  fastify.get("/google/login", passport.authenticate("google"));
  fastify.get(
    "/google/callback",
    {
      preValidation: passport.authenticate("google", {
        successRedirect: client_url_origin + "/",
      }),
    },
    (_, reply) => {
      return reply.code(200);
    }
  );

  fastify.get("/session", { preValidation }, async (request, reply) => {
    if (request.isUnauthenticated())
      return reply.code(401).send(JSONResponse("UNAUTHORIZED", "you are not authenticated"));

    return reply.code(200).send(JSONResponse("OK", "request successful", request.user));
  });

  fastify.get("/logout", async (request, reply) => {
    await request.logOut();
    return reply.redirect(client_url_origin + "/");
  });

  fastify.patch<{ Body: UserSchema }>("/update", async (request, reply) => {
    try {
      const user = request.user as UserSchema;
      await request.logIn({ ...user, ...request.body });

      return reply.code(200).send(JSONResponse("OK", "session updated", { ...user, ...request.body }));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });
}
