import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { startSession } from "mongoose";
import Conversation, { ConversationSchema } from "../../database/models/Conversation";
import Message from "../../database/models/Message";
import User, { UserSchema } from "../../database/models/User";
import JSONResponse from "../../lib/json-response";

export default function v1ConversationRouter(fastify: FastifyInstance, _: FastifyPluginOptions, done: () => void) {
  //create
  fastify.post<{ Body: ConversationSchema }>(
    "/",
    { preValidation: async (request) => await request.jwtVerify() },
    async (request, reply) => {
      try {
        const session = await startSession();
        session.startTransaction();

        const user = request.user as UserSchema & { id: string };
        const { members } = request.body;

        if (members.length === 2) {
          if (
            await Conversation.exists({
              members: { $size: members.length, $all: members },
            })
          )
            return reply.code(409).send(JSONResponse("CONFLICT", "conversation already exist"));
        }

        let name = [];
        for (const member of members) {
          const found_user = await User.findOne({ _id: member }).select("display_name");
          if (!found_user)
            return reply.code(404).send(JSONResponse("NOT_FOUND", "user with id: " + member + " does not exist"));

          name.push(found_user.display_name);
        }

        const new_conversation = new Conversation({
          is_group_chat: members.length > 2,
          name: members.length > 2 ? name.join(", ") : "",
          members,
          admins: members.length > 2 ? user.id : members,
        });

        await new_conversation.save({ session });
        await session.commitTransaction();
        await session.endSession();

        return reply.code(201).send(JSONResponse("CREATED", "new conversation created", new_conversation.toJSON()));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //read
  fastify.get<{ Querystring: { members: string } }>("/", async (request, reply) => {
    try {
      const { members } = request.query;

      if (!members) return reply.code(400).send(JSONResponse("BAD_REQUEST", 'search query key "members" is required'));

      const members_list = members.split(",");

      const found_conversations = await Conversation.find({
        members: { $size: members_list.length, $all: members_list },
      });

      return reply.code(200).send(
        JSONResponse(
          "OK",
          "request successful",
          found_conversations.map((convo) => convo.toJSON())
        )
      );
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });
  fastify.get<{ Params: { id: string }; Querystring: { page: string } }>(
    "/:id/messages",
    { preValidation: async (request) => await request.jwtVerify() },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { page } = request.query;
        const user = request.user as UserSchema & { id: string };

        if (!page)
          return reply
            .code(400)
            .send(JSONResponse("BAD_REQUEST", ' search query key "page" with a default value of 1 is required'));
        if (!Number(page)) return reply.code(400).send(JSONResponse("BAD_REQUEST", "page must be a number"));

        const found_conversation = await Conversation.findOne({ _id: id }).select("members");
        if (!found_conversation) return reply.code(404).send(JSONResponse("NOT_FOUND", "conversation does not exist"));

        if (!found_conversation.members.some((member) => member.toString() === user.id))
          return reply.code(403).send(JSONResponse("FORBIDDEN", "you are not a member of this conversation"));

        const limit = 15;
        const skip = (Number(page) - 1) * limit;

        const messages = await Message.find({ conversation: id })
          .sort({ date_created: 1 })
          .skip(skip)
          .limit(limit)
          .populate({ path: "sender", select: "photo", populate: { path: "photo", select: "url" } });

        return reply.code(200).send(
          JSONResponse(
            "OK",
            "request successful",
            messages.map((msg) => msg.toJSON())
          )
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
