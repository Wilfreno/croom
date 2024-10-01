import { FastifyInstance, FastifyPluginOptions } from "fastify";
import v1UserRouter from "./user";
import v1OTPRouter from "./otp";
import v1LobbyRouter from "./lobby";
import v1InviteRouter from "./invite";
import v1MessageRouter from "./message";

export default function v1Router(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  fastify.register(v1UserRouter, { prefix: "/user" });
  fastify.register(v1LobbyRouter, { prefix: "/lobby" });
  fastify.register(v1InviteRouter, { prefix: "/invite" });
  fastify.register(v1MessageRouter, { prefix: "/message" });
  fastify.register(v1OTPRouter, { prefix: "/otp" });
  done();
}
