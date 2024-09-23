import { FastifyInstance } from "fastify";
import { startSession } from "mongoose";
import Lobby, { type Lobby as LobbyType } from "src/database/models/Lobby";
import Member from "src/database/models/Member";
import User from "src/database/models/User";
import JSONResponse from "src/lib/json-response";

export default async function v1ChatRouter(fastify: FastifyInstance) {
  //create route

  fastify.post(
    "/",
    { preValidation: async (request) => request.jwtVerify() },
    async (request, reply) => {
      try {
        const session = await startSession();
        session.startTransaction();

        if (!(await User.findOne({ _id: request.user.id })))
          return reply
            .code(404)
            .send(
              JSONResponse(
                "NOT_FOUND",
                "cannot create a new lobby; user does not exist"
              )
            );

        const lobby = new Lobby();

        await lobby.save({ session });

        const member = new Member({
          lobby: lobby.id,
          user: request.user.id,
          role: "ADMIN",
        });

        await member.save({ session });

        await session.commitTransaction();
        await session.endSession();

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
