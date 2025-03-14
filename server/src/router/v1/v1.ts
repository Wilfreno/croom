import { FastifyInstance, FastifyPluginOptions } from "fastify";
import v1UserRouter from "./user";
import v1OTPRouter from "./otp";
import v1SearchRouter from "./search";
import v1ConversationRouter from "./conversation";
import v1MessageRouter from "./message";
import v1AuthRouter from "./auth";
import v1PhotoRouter from "./photo";
import v1BlockRouter from "./block";

export default function v1Router(fastify: FastifyInstance, _: FastifyPluginOptions, done: () => void) {
  fastify.register(v1AuthRouter, { prefix: "/auth" });
  fastify.register(v1UserRouter, { prefix: "/user" });
  fastify.register(v1OTPRouter, { prefix: "/otp" });
  fastify.register(v1ConversationRouter, { prefix: "/conversation" });
  fastify.register(v1MessageRouter, { prefix: "/message" });
  fastify.register(v1SearchRouter, { prefix: "/search" });
  fastify.register(v1PhotoRouter, { prefix: "/photo" });
  fastify.register(v1BlockRouter, { prefix: "/block" });

  done();
}
