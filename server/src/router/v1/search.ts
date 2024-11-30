import { FastifyInstance, FastifyPluginOptions } from "fastify";
import ChatRoom from "src/database/models/ChatRoom";
import User, { UserSchema } from "src/database/models/User";
import JSONResponse from "src/lib/json-response";

export default function v1SearchRouter(fastify: FastifyInstance, _: FastifyPluginOptions, done: () => void) {
  //create
  //read

  fastify.get<{ Querystring: { value: string } }>(
    "/",
    { preValidation: async (request) => await request.jwtVerify() },
    async (request, reply) => {
      try {
        const { value } = request.query;
        const user = request.user as UserSchema & { id: string };
        if (!value) return reply.code(400).send(JSONResponse("BAD_REQUEST", "search is required as a search query"));

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
              _id: { $not: user.id },
            },
          ],
        })
          .select("display_name username photo")
          .populate({ path: "photo", select: "url" });

        const found_chat_rooms = await ChatRoom.find({
          name: {
            $regex: "^" + value,
            $options: "i",
          },
        })
          .select("photo members")
          .populate({ path: "photo", select: "url" })
          .populate({ path: "member", select: "status" });

        return reply
          .code(200)
          .send(
            JSONResponse("OK", "request successful", [
              ...found_users.map((user) => ({ ...user.toJSON(), type: "USER" })),
              ...found_chat_rooms.map((found_chat_room) => ({ ...found_chat_room.toJSON(), type: "CHAT_ROOM" })),
            ])
          );
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
