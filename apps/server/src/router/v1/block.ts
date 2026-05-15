import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { ClientSession, startSession } from "mongoose";
import Block from "../../database/models/Block";
import User, { UserSchema } from "../../database/models/User";
import JSONResponse from "../../lib/json-response";
import { preValidation } from "../../lib/middleware";

export default function v1BlockRouter(fastify: FastifyInstance, _: FastifyPluginOptions, done: () => void) {
  //create
  fastify.post<{ Body: { blocked_user: string } }>("/", { preValidation }, async (request, reply) => {
    let session: ClientSession | null = null;

    try {
      const { blocked_user } = request.body;
      const user = request.user as UserSchema & { id: string };

      const found_user = await User.findOne({ _id: blocked_user });
      if (!found_user) return reply.code(404).send(JSONResponse("NOT_FOUND", "user does not exist"));

      if (await Block.exists({ blocker: user.id, blocked_user }))
        return reply.code(409).send(JSONResponse("CONFLICT", "user has already been blocked"));

      session = await startSession();
      session.startTransaction();

      const new_block = new Block({ blocked_user, blocker: user.id });
      await new_block.save({ session });

      await session.commitTransaction();
      await session.endSession();

      return reply.code(200).send(JSONResponse("OK", "conversation has been blocked"));
    } catch (error) {
      await session?.abortTransaction();
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  //read
  //update
  //delete

  fastify.delete<{ Body: { id: string } }>("/", { preValidation }, async (request, reply) => {
    let session: ClientSession | null = null;

    try {
      const { id } = request.body;

      session = await startSession();
      session.startTransaction();

      await Block.deleteOne({ _id: id }, { session });

      await session.commitTransaction();
      await session.endSession();

      return reply.code(200).send(JSONResponse("OK"));
    } catch (error) {
      await session?.abortTransaction();
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });
  done();
}
