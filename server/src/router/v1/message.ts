import { FastifyInstance, FastifyPluginOptions } from "fastify";
import JSONResponse from "../../lib/json-response";
import { UserSchema } from "../../database/models/User";
import Message, { MessageSchema } from "../../database/models/Message";
import { startSession } from "mongoose";
import Photo from "../../database/models/Photo";
import Conversation from "../../database/models/Conversation";

export default function v1MessageRouter(fastify: FastifyInstance, _: FastifyPluginOptions, done: () => void) {
  const redis_pub = fastify.redis["pub"];

  //create
  fastify.post<{ Body: Omit<MessageSchema, "photos"> & { photos: { url: string; width: number; height: number }[] } }>(
    "/",
    { preValidation: async (request) => await request.jwtVerify() },
    async (request, reply) => {
      try {
        const user = request.user as UserSchema & { id: string };
        const { text, photos, conversation } = request.body;

        const found_conversation = await Conversation.findOne({ _id: conversation });

        if (!found_conversation) return reply.code(404).send(JSONResponse("NOT_FOUND", "Conversation does not exist"));
        const session = await startSession();
        session.startTransaction();

        const new_message = new Message({
          sender: user.id,
          conversation,
        });

        if (text) {
          new_message.text = text;
        }

        for (const photo of photos) {
          const new_photo = new Photo({
            owner: user.id,
            url: photo.url,
            width: photo.width,
            height: photo.height,
          });
          await new_photo.save({ session });
          new_message.photos.push(new_photo._id);
        }

        await new_message.save({ session });
        await Conversation.updateOne({ _id: conversation }, { $push: { messages: new_message._id } });

        const message_json = (
          await new_message
            .populate({
              path: "sender",
              select: "username display_name photo",
              populate: { path: "photo", select: "url" },
            })
            .then((data) => data.populate({ path: "conversation", select: "_id members" }))
        ).toJSON();

        await redis_pub.publish("MESSAGE", JSON.stringify(message_json));

        await session.commitTransaction();
        await session.endSession();

        return reply.code(201).send(JSONResponse("CREATED", "message sent"));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //read
  //update
  //delete

  done();
}
