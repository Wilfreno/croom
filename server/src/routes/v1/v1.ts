import { FastifyInstance, FastifyPluginOptions } from "fastify";
import v1UserRouter from "./user";
import v1OTPRouter from "./otp";

export default function v1Router(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  fastify.register(v1UserRouter, { prefix: "/user" });
  fastify.register(v1OTPRouter, { prefix: "/otp" });
  done();
}
