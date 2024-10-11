import { FastifyInstance, FastifyPluginOptions } from "fastify";
import Lobby from "../../database/models/Lobby";
import Member from "../../database/models/Member";
import Message from "../../database/models/Message";
import { User } from "../../database/models/User";
import JSONResponse from "../../lib/json-response";

export default function v1MessageRouter(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  //create route
  const redis_pub = fastify.redis["pub"];

  fastify.post<{ Body: { lobby_id: string; message: string } }>(
    "/",
    {
      preValidation: async (request) => await request.jwtVerify(),
    },
    async (request, reply) => {
      try {
        const { lobby_id, message } = request.body;
        const user = request.user as User & { id: string };

        if (!(await Lobby.exists({ _id: lobby_id })))
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "lobby does not exist"));

        if (!Member.exists({ lobby: lobby_id, user: user.id }))
          return reply
            .code(403)
            .send(
              JSONResponse("FORBIDDEN", "you are not a member of the lobby")
            );

        const new_message = new Message({
          lobby: lobby_id,
          sender: user.id,
          type: "TEXT",
          text: message,
        });

        await new_message.save();
        await Lobby.updateOne(
          { _id: lobby_id },
          { $push: { messages: new_message._id } }
        );

        const message_json = (
          await new_message
            .populate({
              path: "sender",
              select: "username display_name photo",
              populate: { path: "photo", select: "url" },
            })
            .then((data) => data.populate({ path: "lobby", select: "_id" }))
        ).toJSON();

        await redis_pub.publish("MESSAGE", JSON.stringify(message_json));

        return reply
          .code(201)
          .send(JSONResponse("CREATED", "message sent", message_json));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //read route
  //update route
  fastify.patch<{ Body: { message_id: string; message: string } }>(
    "/",
    { preValidation: async (request) => await request.jwtVerify() },
    async (request, reply) => {
      try {
        const { message_id, message } = request.body;
        const user = request.user as User & { id: string };

        if (!message_id || !message)
          return reply
            .code(400)
            .send(
              JSONResponse(
                "BAD_REQUEST",
                "message_id and message is required on the request body"
              )
            );

        const found_message = await Message.findOne({ _id: message_id });

        if (!found_message)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "message does not exist"));

        if (found_message.status === "UPDATED")
          return reply
            .code(409)
            .send(JSONResponse("CONFLICT", "message already been deleted"));

        if ((found_message.sender as unknown as string) !== user.id)
          return reply
            .code(403)
            .send(
              JSONResponse(
                "FORBIDDEN",
                "you cannot change a message that not is yours"
              )
            );

        const updated_message = await Message.findOneAndUpdate(
          {
            _id: message_id,
          },
          {
            $set: {
              text: message,
              status: "UPDATED",
              last_updated: new Date(),
            },
          },
          {
            new: true,
          }
        );

        await redis_pub.publish(
          "MESSAGE",
          JSON.stringify(updated_message!.toJSON())
        );
        return reply.code(200).send(JSONResponse("OK", "message updated"));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //delete route
  fastify.delete<{ Body: { message_id: string } }>(
    "/",
    { preValidation: async (request) => await request.jwtVerify() },
    async (request, reply) => {
      try {
        const { message_id } = request.body;
        const user = request.user as User & { id: string };

        if (!message_id)
          return reply
            .code(400)
            .send(
              JSONResponse(
                "BAD_REQUEST",
                "message_id is required on the request body"
              )
            );

        const found_message = await Message.findOne({ _id: message_id });

        if (!found_message)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "message doe not exist"));

        if ((found_message.sender as unknown as string) !== user.id)
          return reply
            .code(403)
            .send(
              JSONResponse(
                "FORBIDDEN",
                "you cant delete a message that's not yours"
              )
            );

        const deleted_message = await Message.findOneAndUpdate(
          { _id: message_id },
          { $set: { status: "DELETED", text: null, last_updated: new Date() } }
        );

        await redis_pub.publish(
          "MESSAGE",
          JSON.stringify(deleted_message!.toJSON())
        );
        return reply.code(200).send(JSONResponse("OK", "message deleted"));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  done();
}
