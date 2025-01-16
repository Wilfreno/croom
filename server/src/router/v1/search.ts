import { FastifyInstance, FastifyPluginOptions } from "fastify";
import Conversation from "../../database/models/Conversation";
import User, { UserSchema } from "../../database/models/User";
import JSONResponse from "../../lib/json-response";
<<<<<<< HEAD
import { preValidation } from "../../lib/middleware";

export default function v1SearchRouter(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
=======

export default function v1SearchRouter(fastify: FastifyInstance, _: FastifyPluginOptions, done: () => void) {
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
  //create
  //read

  fastify.get<{ Querystring: { value: string } }>(
    "/",
<<<<<<< HEAD
    { preValidation },
=======
    { preValidation: async (request) => await request.jwtVerify() },
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
    async (request, reply) => {
      try {
        const { value } = request.query;
        const user = request.user as UserSchema & { id: string };
<<<<<<< HEAD
        if (!value)
          return reply
            .code(400)
            .send(JSONResponse("BAD_REQUEST", "search is required as a search query"));
=======
        if (!value) return reply.code(400).send(JSONResponse("BAD_REQUEST", "search is required as a search query"));
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

        const found_users = await User.find({
          $and: [
            {
              $or: [
                {
                  username: {
                    $regex: "^" + value,
                    $options: "i",
                  },
                },
                {
                  display_name: {
                    $regex: "^" + value,
                    $options: "i",
                  },
                },
              ],
            },
            {
              _id: { $ne: user.id },
            },
          ],
        })
          .select("display_name username photo status")
          .populate({ path: "photo", select: "url" });

        const found_chat_rooms = await Conversation.find({
          name: {
            $regex: "^" + value,
            $options: "i",
          },
        })
          .select("photo members")
          .populate({ path: "photo", select: "url" })
          .populate({ path: "member", select: "status" });

<<<<<<< HEAD
        return reply.code(200).send(
          JSONResponse("OK", "request successful", [
            ...found_users.map((user) => ({ ...user.toJSON(), type: "USER" })),
            ...found_chat_rooms.map((found_chat_room) => ({
              ...found_chat_room.toJSON(),
              type: "CHAT_ROOM",
            })),
          ])
        );
=======
        return reply
          .code(200)
          .send(
            JSONResponse("OK", "request successful", [
              ...found_users.map((user) => ({ ...user.toJSON(), type: "USER" })),
              ...found_chat_rooms.map((found_chat_room) => ({ ...found_chat_room.toJSON(), type: "CHAT_ROOM" })),
            ])
          );
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //update
  //delete

  done();
}
