import { FastifyInstance, FastifyPluginOptions } from "fastify";
import v1UserRouter from "./user";

export default function v1Router(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  fastify.register(v1UserRouter, { prefix: "/user" });
  done();
}
