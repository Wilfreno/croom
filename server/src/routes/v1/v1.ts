import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default function v1Router(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {

    fastify.register
  done();
}
