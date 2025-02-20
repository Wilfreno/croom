import passport from "@fastify/passport";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { googleStrategy } from "./strategy/google";
import localStrategy from "./strategy/local";
import User, { UserSchema } from "../../database/models/User";

export default function passportStrategy(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  passport.registerUserSerializer<UserSchema & { id: string }, unknown>(
    async (user) => user.id
  );

  passport.registerUserDeserializer<string, unknown>(async (id) => {
    try {
      const found_user = await User.findOne({ _id: id })
        .select("-password")
        .populate({ path: "photo", select: "url" });

      if (!found_user) throw new Error("User does not exist");
      return found_user.toJSON();
    } catch (error) {
      throw error;
    }
  });

  passport.use("google", googleStrategy());
  passport.use("local", localStrategy());

  done();
}
