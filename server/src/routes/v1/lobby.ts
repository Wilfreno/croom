import { FastifyInstance } from "fastify";
import { startSession } from "mongoose";
import Lobby, { type Lobby as LobbyType } from "src/database/models/Lobby";
import User, { type User as UserType } from "src/database/models/User";
import JSONResponse from "src/lib/json-response";

export default async function v1ChatRouter(fastify: FastifyInstance) {
  //create route

  fastify.post<{ Body: { creator_id: string; members: string[] } }>(
    "/",
    async (request, reply) => {
      try {
        const session = await startSession()
        session.startTransaction
        const { members, creator_id } = request.body;

        if (!members || !creator_id)
          return reply
            .code(400)
            .send(
              JSONResponse(
                "BAD_REQUEST",
                "creator_id and members is required on the request body"
              )
            );

        let found_users: UserType[] = [];

        if (members.length > 2) {
          found_users = await User.find({
            $or: [...members.map((id) => ({ _id: id })), { _id: creator_id }],
          }).select("username");
        }

        const lobby = new Lobby({
          members,
          is_group_chat: members.length > 2,
          name:
            members.length > 2
              ? found_users.reduce(
                  (prev, current, index) =>
                    prev +
                    (current.username +
                      (index === found_users.length - 1 ? "" : ", ")),
                  ""
                )
              : null,
        });

        
        await lobby.save();

        return reply
          .code(201)
          .send(
            JSONResponse("CREATED", "new lobby is created", lobby.toJSON())
          );
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
