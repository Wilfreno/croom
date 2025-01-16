import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { ClientSession, startSession, Types } from "mongoose";
import Conversation, { ConversationSchema } from "../../database/models/Conversation";
import Message from "../../database/models/Message";
import User, { UserSchema } from "../../database/models/User";
import JSONResponse from "../../lib/json-response";
import Photo, { PhotoSchema } from "../../database/models/Photo";
<<<<<<< HEAD
import Report from "../../database/models/Report";
import { preValidation } from "../../lib/middleware";

export default function v1ConversationRouter(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  //create
  fastify.post<{ Body: ConversationSchema }>(
    "/",
    {
      preValidation,
    },
=======

export default function v1ConversationRouter(fastify: FastifyInstance, _: FastifyPluginOptions, done: () => void) {
  //create
  fastify.post<{ Body: ConversationSchema }>(
    "/",
    { preValidation: async (request) => await request.jwtVerify() },
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
    async (request, reply) => {
      let session: ClientSession | null = null;
      try {
        session = await startSession();
        session.startTransaction();

        const user = request.user as UserSchema & { id: string };
        const { members } = request.body;

        if (members.length === 2) {
          if (
            await Conversation.exists({
              members: { $size: members.length, $all: members },
            })
          )
<<<<<<< HEAD
            return reply
              .code(409)
              .send(JSONResponse("CONFLICT", "conversation already exist"));
=======
            return reply.code(409).send(JSONResponse("CONFLICT", "conversation already exist"));
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
        }

        let name = [];
        for (const member of members) {
          const found_user = await User.findOne({ _id: member }).select("display_name");
          if (!found_user)
<<<<<<< HEAD
            return reply
              .code(404)
              .send(
                JSONResponse("NOT_FOUND", "user with id: " + member + " does not exist")
              );
=======
            return reply.code(404).send(JSONResponse("NOT_FOUND", "user with id: " + member + " does not exist"));
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

          name.push(found_user.display_name);
        }

        console.log(members.map((member) => [member, ""]));
        const new_conversation = new Conversation({
          is_group_chat: members.length > 2,
          name: members.length > 2 ? name.join(", ") : "",
          members,
          admins: members.length > 2 ? user.id : members,
          nicknames: members.map((member) => ({ user: member })),
        });

        for (const member of members) {
          await User.updateOne(
            { _id: member },
<<<<<<< HEAD
            {
              $set: { last_updated: new Date() },
              $push: { conversations: new_conversation._id },
            }
=======
            { $set: { last_updated: new Date() }, $push: { conversations: new_conversation._id } }
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
          );
        }

        await new_conversation.save({ session });
        await session.commitTransaction();
        await session.endSession();

<<<<<<< HEAD
        return reply
          .code(201)
          .send(
            JSONResponse("CREATED", "new conversation created", new_conversation.toJSON())
          );
      } catch (error) {
        await session?.abortTransaction();
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );

  fastify.post<{ Body: { reported_user: string; conversation: string } }>(
    "/report",
    { preValidation },
    async (request, reply) => {
      let session: ClientSession | null = null;
      try {
        session = await startSession();
        session.startTransaction();

        const user = request.user as UserSchema & { id: string };
        const { reported_user, conversation } = request.body;

        const found_conversation = await Conversation.findOne({ _id: conversation });
        if (!found_conversation)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "conversation does not exist"));
        if (!found_conversation.members.some((member) => member.toString() === user.id))
          return reply
            .code(403)
            .send(JSONResponse("FORBIDDEN", "you are not a member of this conversation"));

        const report = new Report({
          conversation: conversation,
          submitted_by: user.id,
          reported_user: reported_user,
        });

        await report.save({ session });

        await session.commitTransaction();
        await session.endSession();

        return reply
          .code(201)
          .send(JSONResponse("CREATED", "report created", report.toJSON()));
      } catch (error) {
        await session?.abortTransaction();
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );

  fastify.post<{ Body: { conversation: string } }>(
    "/leave",
    { preValidation },
    async (request, reply) => {
      let session: ClientSession | null = null;

      try {
        session = await startSession();
        session.startTransaction();

        const user = request.user as UserSchema & { id: string };
        const { conversation } = request.body;

        const found_conversation = await Conversation.findOne({ _id: conversation });
        if (!found_conversation)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "conversation does not exist"));

        if (!found_conversation.members.some((member) => member.toString() === user.id))
          return reply
            .code(403)
            .send(JSONResponse("FORBIDDEN", "you are not a member of this conversation"));

        await Conversation.updateOne(
          {
            _id: conversation,
          },
          {
            $pull: { members: user.id },
          },
          { session }
        );

        if (found_conversation.members.length === 1) {
          await Conversation.deleteOne({ _id: conversation }, { session });
        }

        await session.commitTransaction();
        await session.endSession();

        return reply.code(200).send(JSONResponse("OK", "you have left the conversation"));
=======
        return reply.code(201).send(JSONResponse("CREATED", "new conversation created", new_conversation.toJSON()));
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
      } catch (error) {
        await session?.abortTransaction();
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //read
  fastify.get<{ Querystring: { members: string } }>(
    "/",
<<<<<<< HEAD
    { preValidation },
=======
    { preValidation: async (request) => await request.jwtVerify() },
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
    async (request, reply) => {
      try {
        const { members } = request.query;
        const user = request.user as UserSchema & { id: string };

        if (!members)
<<<<<<< HEAD
          return reply
            .code(400)
            .send(JSONResponse("BAD_REQUEST", 'search query key "members" is required'));
=======
          return reply.code(400).send(JSONResponse("BAD_REQUEST", 'search query key "members" is required'));
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

        const members_list = members.split(",");

        const found_group_conversations = await Conversation.find({
          members: { $size: members_list.length, $all: members_list },
          is_group_chat: true,
        });

        const found_non_group_conversations = await Conversation.find({
          members: { $size: members_list.length, $all: members_list },
          is_group_chat: false,
        }).populate({
          path: "members",
          match: { _id: { $ne: user.id } },
          select: "username display_name photo status last_online",
          populate: { path: "photo", select: "url" },
        });

        return reply
          .code(200)
          .send(
            JSONResponse("OK", "request successful", [
              ...found_group_conversations.map((convo) => convo.toJSON()),
              ...found_non_group_conversations.map((convo) => convo.toJSON()),
            ])
          );
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      const found_conversation = await Conversation.findOne({ _id: id })
        .populate({
          path: "members",
          select: "username display_name photo status last_online",
          populate: { path: "photo", select: "url" },
        })
        .populate({
          path: "admins",
          select: "username display_name photo status last_online",
          populate: { path: "photo", select: "url" },
        })
        .populate({ path: "photo", select: "url" });

<<<<<<< HEAD
      if (!found_conversation)
        return reply
          .code(404)
          .send(JSONResponse("NOT_FOUND", "conversation does not exist"));

      return reply
        .code(200)
        .send(JSONResponse("OK", "request successful", found_conversation.toJSON()));
=======
      if (!found_conversation) return reply.code(404).send(JSONResponse("NOT_FOUND", "conversation does not exist"));

      return reply.code(200).send(JSONResponse("OK", "request successful", found_conversation.toJSON()));
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });
  fastify.get<{ Params: { id: string }; Querystring: { page: string } }>(
    "/:id/messages",
<<<<<<< HEAD
    { preValidation },
=======
    { preValidation: async (request) => await request.jwtVerify() },
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { page } = request.query;
        const user = request.user as UserSchema & { id: string };

        if (!page)
          return reply
            .code(400)
<<<<<<< HEAD
            .send(
              JSONResponse(
                "BAD_REQUEST",
                ' search query key "page" with a default value of 1 is required'
              )
            );
        if (!Number(page))
          return reply
            .code(400)
            .send(JSONResponse("BAD_REQUEST", "page must be a number"));

        const found_conversation = await Conversation.findOne({ _id: id }).select(
          "members"
        );
        if (!found_conversation)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "conversation does not exist"));

        if (!found_conversation.members.some((member) => member.toString() === user.id))
          return reply
            .code(403)
            .send(JSONResponse("FORBIDDEN", "you are not a member of this conversation"));
=======
            .send(JSONResponse("BAD_REQUEST", ' search query key "page" with a default value of 1 is required'));
        if (!Number(page)) return reply.code(400).send(JSONResponse("BAD_REQUEST", "page must be a number"));

        const found_conversation = await Conversation.findOne({ _id: id }).select("members");
        if (!found_conversation) return reply.code(404).send(JSONResponse("NOT_FOUND", "conversation does not exist"));

        if (!found_conversation.members.some((member) => member.toString() === user.id))
          return reply.code(403).send(JSONResponse("FORBIDDEN", "you are not a member of this conversation"));
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

        const limit = 15;
        const skip = (Number(page) - 1) * limit;

        const messages = await Message.find({ conversation: id })
          .sort({ date_created: -1 })
          .skip(skip)
          .limit(limit)
<<<<<<< HEAD
          .populate({
            path: "sender",
            select: "photo",
            populate: { path: "photo", select: "url" },
          })
=======
          .populate({ path: "sender", select: "photo", populate: { path: "photo", select: "url" } })
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
          .populate({ path: "photos", select: "url height width " });

        return reply
          .code(200)
<<<<<<< HEAD
          .send(
            JSONResponse(
              "OK",
              "request successful",
              messages.map((msg) => msg.toJSON()).reverse()
            )
          );
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id/media",
    {
      preValidation,
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const user = request.user as UserSchema & { id: string };

        const found_conversation = await Conversation.findOne({ _id: id });
        if (!found_conversation)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "conversation does not exist"));
        if (!found_conversation.members.some((member) => member.toString() === user.id))
          return reply
            .code(403)
            .send(JSONResponse("FORBIDDEN", "you are not a member of this conversation"));

        const found_messages = await Message.find({
          conversation: id,
          photos: { $ne: [] },
        })
          .populate({
            path: "photos",
            select: "url width height",
          })
          .populate({
            path: "sender",
            select: "display_name username photo status last_online",
            populate: { path: "photo", select: "url" },
          })
          .select("sender photos status date_created");

        return reply.code(200).send(
          JSONResponse(
            "OK",
            "request successful",
            found_messages.map((msg) => msg.toJSON())
          )
        );
=======
          .send(JSONResponse("OK", "request successful", messages.map((msg) => msg.toJSON()).reverse()));
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //update
  fastify.patch<{
    Params: { id: string; key: keyof ConversationSchema };
    Body: {
      name: string;
      admin: string;
<<<<<<< HEAD
      action: "ADD" | "REMOVE";
      member: string;
=======
      admin_action: "ADD" | "REMOVE";
      members: string[];
      member_action: "ADD" | "REMOVE";
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
      nickname: { user: string; value: string };
      photo: PhotoSchema;
    };
  }>(
    "/:id/:key",
    {
<<<<<<< HEAD
      preValidation,
=======
      preValidation: async (request) => await request.jwtVerify(),
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
    },
    async (request, reply) => {
      let session: ClientSession | null = null;
      try {
        const { id, key } = request.params;
<<<<<<< HEAD
        const { name, admin, member, action, nickname, photo } = request.body;
        const user = request.user as UserSchema & { id: string };

        const found_conversation = await Conversation.findOne({ _id: id });
        if (!found_conversation)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "conversation does not exist"));
=======
        const { name, admin, admin_action, members, member_action, nickname, photo } = request.body;
        const user = request.user as UserSchema & { id: string };

        const found_conversation = await Conversation.findOne({ _id: id });
        if (!found_conversation) return reply.code(404).send(JSONResponse("NOT_FOUND", "conversation does not exist"));
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

        session = await startSession();
        session.startTransaction();

        switch (key) {
          case "name": {
            if (!found_conversation.admins.some((admin) => admin.toString() === user.id))
<<<<<<< HEAD
              return reply
                .code(403)
                .send(
                  JSONResponse("FORBIDDEN", "you are not an admin of this conversation")
                );

            if (!found_conversation.is_group_chat)
              return reply
                .code(409)
                .send(
                  JSONResponse("CONFLICT", "non group conversations cannot have a name")
                );

            await Conversation.updateOne(
              { _id: id },
              { $set: { name, last_updated: new Date() } },
              { session }
            );
=======
              return reply.code(403).send(JSONResponse("FORBIDDEN", "you are not an admin of this conversation"));

            if (!found_conversation.is_group_chat)
              return reply.code(409).send(JSONResponse("CONFLICT", "non group conversations cannot have a name"));

            await Conversation.updateOne({ _id: id }, { $set: { name, last_updated: new Date() } }, { session });
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
            break;
          }
          case "admins": {
            if (!found_conversation.admins.some((admin) => admin.toString() === user.id))
<<<<<<< HEAD
              return reply
                .code(403)
                .send(
                  JSONResponse("FORBIDDEN", "you are not an admin of this conversation")
                );

            switch (action) {
              case "ADD": {
                if (
                  found_conversation.admins.some(
                    (user_id) => user_id.toString() === admin
                  )
                ) {
                  const found_user = await User.findOne({ _id: admin }).select(
                    "display_name"
                  );
                  return reply
                    .code(409)
                    .send(
                      JSONResponse(
                        "CONFLICT",
                        found_user?.display_name + " is already an admin"
                      )
                    );
=======
              return reply.code(403).send(JSONResponse("FORBIDDEN", "you are not an admin of this conversation"));

            switch (admin_action) {
              case "ADD": {
                if (found_conversation.admins.some((user_id) => user_id.toString() === admin)) {
                  const found_user = await User.findOne({ _id: admin }).select("display_name");
                  return reply
                    .code(409)
                    .send(JSONResponse("CONFLICT", found_user?.display_name + " is already an admin"));
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
                }
                await Conversation.updateOne(
                  { _id: id },
                  { $push: { admins: admin }, $set: { last_updated: new Date() } },
                  { session }
                );

                break;
              }
              case "REMOVE": {
<<<<<<< HEAD
                if (
                  !found_conversation.admins.some(
                    (user_id) => user_id.toString() === admin
                  )
                ) {
                  const found_user = await User.findOne({ _id: admin }).select(
                    "display_name"
                  );
                  return reply
                    .code(409)
                    .send(
                      JSONResponse(
                        "CONFLICT",
                        found_user?.display_name + " is already not an admin"
                      )
                    );
=======
                if (!found_conversation.admins.some((user_id) => user_id.toString() === admin)) {
                  const found_user = await User.findOne({ _id: admin }).select("display_name");
                  return reply
                    .code(409)
                    .send(JSONResponse("CONFLICT", found_user?.display_name + " is already not an admin"));
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
                }

                await Conversation.updateOne(
                  { _id: id },
                  { $pull: { admins: admin }, $set: { last_updated: new Date() } },
                  { session }
                );

                break;
              }
            }
            break;
          }
          case "members": {
            if (!found_conversation.admins.some((admin) => admin.toString() === user.id))
<<<<<<< HEAD
              return reply
                .code(403)
                .send(
                  JSONResponse("FORBIDDEN", "you are not an admin of this conversation")
                );

            switch (action) {
              case "ADD": {
                if (
                  found_conversation.members.some(
                    (found_member) => found_member.toString() === member
                  )
                ) {
                  const found_user = await User.findOne({ _id: member }).select(
                    "display_name"
                  );
                  return reply
                    .code(409)
                    .send(
                      JSONResponse(
                        "CONFLICT",
                        found_user?.display_name + " is already a member"
                      )
                    );
=======
              return reply.code(403).send(JSONResponse("FORBIDDEN", "you are not an admin of this conversation"));

            switch (member_action) {
              case "ADD": {
                for (const found_member of found_conversation.members) {
                  for (const member of members) {
                    if (member === found_member.toString()) {
                      const found_user = await User.findOne({ _id: member }).select("display_name");
                      return reply
                        .code(409)
                        .send(JSONResponse("CONFLICT", found_user?.display_name + " is already a member"));
                    }
                  }
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
                }

                await Conversation.updateOne(
                  { _id: id },
<<<<<<< HEAD
                  { $push: { members: member }, $set: { last_updated: new Date() } },
=======
                  { $push: { members }, $set: { last_updated: new Date() } },
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
                  { session }
                );

                break;
              }
              case "REMOVE": {
<<<<<<< HEAD
                if (
                  !found_conversation.members.some(
                    (found_member) => found_member.toString() === member
                  )
                ) {
                  const found_user = await User.findOne({ _id: member }).select(
                    "display_name"
                  );
                  return reply
                    .code(409)
                    .send(
                      JSONResponse(
                        "CONFLICT",
                        found_user?.display_name + " is already not a member"
                      )
                    );
=======
                const cached_members = new Set<string>();

                for (const member of members) {
                  if (cached_members.has(member)) continue;

                  for (let i = 0; i < found_conversation.members.length; i++) {
                    if (found_conversation.admins[i].toString() === member) break;
                    if (
                      i === found_conversation.admins.length - 1 &&
                      found_conversation.admins[i].toString() !== member
                    ) {
                      const found_user = await User.findOne({ _id: member }).select("display_name");
                      return reply
                        .code(409)
                        .send(JSONResponse("CONFLICT", found_user?.display_name + " is already not a member"));
                    }

                    cached_members.add(found_conversation.admins[i].toString());
                  }
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
                }

                await Conversation.updateOne(
                  { _id: id },
<<<<<<< HEAD
                  { $pull: { members: member }, $set: { last_updated: new Date() } },
=======
                  { $pull: { members }, $set: { last_updated: new Date() } },
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
                  { session }
                );

                break;
              }
            }
            break;
          }
          case "nicknames": {
            await Conversation.updateOne(
              { _id: id },
              {
                $set: {
                  nicknames: found_conversation.nicknames.map((found_nickname) =>
<<<<<<< HEAD
                    found_nickname.user.toString() === nickname.user
                      ? nickname
                      : found_nickname
=======
                    found_nickname.user.toString() === nickname.user ? nickname : found_nickname
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
                  ),
                },
              },
              { session }
            );
            break;
          }
          case "photo": {
            if (!found_conversation.admins.some((admin) => admin.toString() === user.id))
<<<<<<< HEAD
              return reply
                .code(403)
                .send(
                  JSONResponse("FORBIDDEN", "you are not an admin of this conversation")
                );

            if (found_conversation.photo)
              await Photo.deleteOne({ _id: found_conversation.photo }, { session });
=======
              return reply.code(403).send(JSONResponse("FORBIDDEN", "you are not an admin of this conversation"));

            if (found_conversation.photo) await Photo.deleteOne({ _id: found_conversation.photo }, { session });
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

            const new_photo = new Photo({
              url: photo.url,
              type: "CONVERSATION",
            });

            await new_photo.save({ session });

            await Conversation.updateOne(
              { _id: id },
              { $set: { photo: new_photo._id, last_updated: new Date() } },
              { session }
            );
            break;
          }
          default:
            return reply.code(400).send(JSONResponse("BAD_REQUEST", "invalid request"));
        }
        await session.commitTransaction();
        await session.endSession();

        return reply.code(200).send(JSONResponse("OK", key + " updated"));
      } catch (error) {
        await session?.abortTransaction();
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //delete

  done();
}
