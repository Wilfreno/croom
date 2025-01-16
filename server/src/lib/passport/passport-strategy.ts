import passport from "@fastify/passport";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { googleStrategy } from "./strategy/google";
import localStrategy from "./strategy/local";

export default function passportStrategy(fastify: FastifyInstance, _: FastifyPluginOptions, done: () => void) {
  passport.registerUserSerializer(async (user) => {
    return user;
  });

  passport.registerUserDeserializer(async (user) => {
    return user;
  });

  passport.use("google", googleStrategy());
  passport.use("local", localStrategy());

  done();
}
