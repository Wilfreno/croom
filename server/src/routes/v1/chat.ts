import { FastifyInstance } from "fastify";
import Chat, { type Chat as ChatType } from "src/database/models/Chat";
import User from "src/database/models/User";
import JSONResponse from "src/lib/json-response";

export default async function v1ChatRouter(fastify: FastifyInstance) {
  //create route

  fastify.post<{ Body: { participants: string[] } }>(
    "/",
    async (request, reply) => {
      try {
        const { participants } = request.body;

        const users = await User.find({
          $or: participants.map((id) => ({ _id: id })),
        }).select("username");

        const chat = new Chat({
          participants,
          is_group_chat: participants.length > 2,
          name: users.join(", "),
        });

        await chat.save();

        return reply
          .code(201)
          .send(JSONResponse("CREATED", "new chat is created", chat.toJSON()));
      } catch (error) {
        fastify.log.error(error);

        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //read route

  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
    } catch (error) {
      fastify.log.error(error);

      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });
  //update route

  //delete route
}
