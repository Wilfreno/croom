import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default async function v1InviteRouter(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  //create route
  fastify.post<{ Body: { lobby_id: string; user_id } }>("/");
  //read route

  //update route

  //delete route

  done();
}
