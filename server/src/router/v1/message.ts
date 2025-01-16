import { FastifyInstance, FastifyPluginOptions } from "fastify";
import JSONResponse from "../../lib/json-response";
import { UserSchema } from "../../database/models/User";
import Message, { MessageSchema } from "../../database/models/Message";
import { ClientSession, startSession } from "mongoose";
import Photo, { PhotoSchema } from "../../database/models/Photo";
import Conversation from "../../database/models/Conversation";
import { preValidation } from "../../lib/middleware";

export default function v1MessageRouter(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  const redis_pub = fastify.redis["pub"];

  //create
  fastify.post<{
    Body: Omit<MessageSchema, "photos"> & {
      photos: { url: string; width: number; height: number }[];
    };
  }>("/", { preValidation }, async (request, reply) => {
    let session: ClientSession | null = null;
    try {
      const user = request.user as UserSchema & { id: string };
      const { text, photos, conversation } = request.body;

      const found_conversation = await Conversation.findOne({ _id: conversation });

      if (!found_conversation)
        return reply
          .code(404)
          .send(JSONResponse("NOT_FOUND", "Conversation does not exist"));
      session = await startSession();
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
          type: "MESSAGE",
          url: photo.url,
          width: photo.width,
          height: photo.height,
        });
        await new_photo.save({ session });
        new_message.photos.push(new_photo._id);
      }

      await new_message.save({ session });
      await Conversation.updateOne(
        { _id: conversation },
        { $push: { messages: new_message._id } },
        { session }
      );

      const message_json = (
        await new_message
          .populate({
            path: "sender",
            select: "username display_name photo",
            populate: { path: "photo", select: "url" },
          })
          .then((data) =>
            data
              .populate({ path: "conversation", select: "_id members" })
              .then((data) =>
                data.populate({ path: "photos", select: "url height width" })
              )
          )
      ).toJSON();

      await redis_pub.publish("MESSAGE", JSON.stringify(message_json));
      await session.commitTransaction();

      return reply.code(201).send(JSONResponse("CREATED", "message sent", message_json));
    } catch (error) {
      await session?.abortTransaction();
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    } finally {
      await session?.endSession();
    }
  });
  //read

  //update

  fastify.patch<{
    Params: { id: string; key: keyof MessageSchema };
    Body: { text: string; photo: PhotoSchema & { id: string }; action: "ADD" | "DELETE" };
  }>(
    "/:id/:key",
    {
      preValidation,
    },
    async (request, reply) => {
      let session: ClientSession | null = null;
      try {
        const { id, key } = request.params;
        const request_body = request.body;
        const user = request.user as UserSchema & { id: string };

        const found_message = await Message.findOne({ _id: id });
        if (!found_message)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "message does not exist"));
        if (found_message.status === "DELETED")
          return reply
            .code(409)
            .send(JSONResponse("FORBIDDEN", "message already deleted"));

        session = await startSession();
        session.startTransaction();

        switch (key) {
          case "text": {
            await Message.updateOne(
              { _id: id },
              { $set: { text: request_body.text, last_updated: new Date() } },
              { session }
            );
            break;
          }
          case "photos": {
            if (!request_body.action)
              return reply
                .code(400)
                .send(
                  JSONResponse(
                    "BAD_REQUEST",
                    'action "ADD" or "DELETE is required on the request body'
                  )
                );

            switch (request_body.action) {
              case "ADD": {
                const new_photo = new Photo(request_body.photo);
                await new_photo.save({ session });
                await Message.updateOne(
                  { _id: id },
                  {
                    $push: { photos: new_photo._id },
                    $set: { last_updated: new Date() },
                  },
                  { session }
                );
                break;
              }
              case "DELETE": {
                await Message.updateOne(
                  { _id: id },
                  {
                    $pull: { photos: [request_body.photo.id] },
                    $set: { last_updated: new Date() },
                  },
                  { session }
                );
                break;
              }
            }
          }
          case "seen_by": {
            if (!request_body.action)
              return reply
                .code(400)
                .send(
                  JSONResponse(
                    "BAD_REQUEST",
                    'action "ADD" or "DELETE is required on the request body'
                  )
                );

            switch (request_body.action) {
              case "ADD": {
                await Message.updateOne(
                  { _id: id },
                  { $push: { seen_by: user.id }, $set: { last_updated: new Date() } },
                  { session }
                );
                break;
              }
              case "DELETE": {
                await Message.updateOne(
                  { _id: id },
                  { $pull: { seen_by: [user.id] }, $set: { last_updated: new Date() } },
                  { session }
                );
                break;
              }
            }
            break;
          }
          default:
            return reply
              .code(400)
              .send(
                JSONResponse("BAD_REQUEST", "can only update text, photos, and seen_by")
              );
        }

        await session.commitTransaction();
        return reply.code(200).send(JSONResponse("OK", key + " successfully updated"));
      } catch (error) {
        await session?.abortTransaction();
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      } finally {
        await session?.endSession();
      }
    }
  );
  //delete

  done();
}
