import { hash } from "bcrypt";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import JSONResponse from "../../lib/json-response";
import User, { UserSchema } from "../../database/models/User";
import Photo from "../../database/models/Photo";
import Conversation from "../../database/models/Conversation";
import { ClientSession, Document, startSession, Types } from "mongoose";
import { preValidation } from "../../lib/middleware";
import Report from "../../database/models/Report";
import Block from "../../database/models/Block";
import { UTApi } from "uploadthing/server";
import OTP from "../../database/models/Otp";

export default function v1UserRouter(fastify: FastifyInstance, _: FastifyPluginOptions, done: () => void) {
  //create user
  fastify.post<{ Body: { reported_user: string; reason: string } }>(
    "/report",
    { preValidation },
    async (request, reply) => {
      let session: ClientSession | null = null;
      try {
        session = await startSession();
        session.startTransaction();

        const user = request.user as UserSchema & { id: string };
        const { reported_user, reason } = request.body;

        const report = new Report({
          submitted_by: user.id,
          reported_user: reported_user,
          reason,
        });

        await report.save({ session });

        await session.commitTransaction();
        await session.endSession();

        return reply.code(201).send(JSONResponse("CREATED", "report created"));
      } catch (error) {
        await session?.abortTransaction();
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );

  //read user
  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      const found_user = await User.findOne({ _id: id })
        .select("email display_name username last_online photo")
        .populate({ path: "photo", select: "url" });

      if (!found_user) return reply.code(404).send(JSONResponse("NOT_FOUND", "user does not exist"));

      return reply.code(200).send(JSONResponse("OK", "request successful"));
    } catch (error) {
      fastify.log.error(error);
      return reply;
    }
  });
  fastify.get<{ Querystring: { value: string } }>("/search", { preValidation }, async (request, reply) => {
    try {
      const { value } = request.query;
      const user = request.user as UserSchema & { id: string };

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

      return reply.code(200).send(
        JSONResponse(
          "OK",
          "request successful",
          found_users.map((user) => user.toJSON())
        )
      );
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  fastify.get<{ Params: { type: "email" | "username"; value: string } }>(
    "/check/:type/:value",
    async (request, reply) => {
      try {
        const { type, value } = request.params;

        switch (type) {
          case "email": {
            if (!(await User.exists({ email: value })))
              return reply.code(404).send(JSONResponse("NOT_FOUND", "email is does not exist"));

            break;
          }
          case "username": {
            if (!(await User.exists({ username: value })))
              return reply.code(404).send(JSONResponse("NOT_FOUND", "email is does not exist"));

            break;
          }
        }

        return reply.code(200).send(JSONResponse("OK", "user found"));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  fastify.get("/conversations", { preValidation }, async (request, reply) => {
    try {
      const user = request.user as UserSchema & { id: string };

      const conversations = [];

      for (const conversation_id of user.conversations) {
        const found_conversation = await Conversation.findOne({ _id: conversation_id })
          .populate({
            path: "photo",
            select: "url",
          })
          .populate({
            path: "messages",
            options: {
              sort: { date_created: -1 },
              limit: 1,
            },
            populate: [
              { path: "sender", select: "display_name" },
              { path: "seen_by", select: "_id" },
            ],
          });

        if (!found_conversation) continue;

        if (found_conversation.is_group_chat) {
          const group_chat = await found_conversation.populate({
            path: "members",
            select: "status",
            match: { _id: { $ne: user.id } },
          });
          conversations.push(group_chat.toJSON());
        } else {
          const direct_convo = await found_conversation.populate({
            path: "members",
            select: "status display_name photo",
            match: { _id: { $ne: user.id } },
            populate: { path: "photo", select: "url" },
          });
          conversations.push(direct_convo.toJSON());
        }
      }

      return reply.code(200).send(JSONResponse("OK", "request successful", conversations));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  fastify.get("/active-conversation", { preValidation }, async (request, reply) => {
    try {
      const user = request.user as UserSchema & { id: string };

      const conversations = [];

      for (const convo of user.conversations) {
        const found_conversation = await Conversation.findOne({ _id: convo });
        if (!found_conversation) continue;

        for (const member of found_conversation.members) {
          if (member.toString() === user.id) continue;

          const found_member = await User.findOne({ _id: member, status: "ONLINE" });
          if (found_member) {
            if (found_conversation.is_group_chat) {
              conversations.push((await found_conversation.populate({ path: "photo", select: "url" })).toJSON());
            } else {
              conversations.push(
                (
                  await found_conversation.populate({
                    path: "members",
                    match: { _id: { $ne: user.id } },
                    select: "display_name photo",
                    populate: { path: "photo", select: "url" },
                  })
                ).toJSON()
              );
            }
            break;
          }
        }
      }

      return reply.code(200).send(JSONResponse("OK", "request successful", conversations));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  fastify.get("/photos", { preValidation }, async (request, reply) => {
    try {
      const user = request.user as UserSchema & { id: string };

      const found_photos = await Photo.find({ owner: user.id, type: "PROFILE" }).sort({
        date_created: -1,
      });

      return reply.code(200).send(
        JSONResponse(
          "OK",
          "request successful",
          found_photos.map((photo) => photo.toJSON())
        )
      );
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });
  fastify.get("/blocked", { preValidation }, async (request, reply) => {
    try {
      const user = request.user as UserSchema & { id: string };

      const found_blocks = await Block.find({ blocker: user.id }).populate({
        path: "blocked_user",
        select: "username photo",
        populate: { path: "photo", select: "url" },
      });

      return reply.code(200).send(
        JSONResponse(
          "OK",
          "request successful",
          found_blocks.map((block) => block.toJSON())
        )
      );
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  //update
  fastify.patch<{
    Params: { key: keyof UserSchema };
    Body: Omit<UserSchema, "photo" | "password"> & {
      photo: { url: string; id: string; key: string; width: number; height: number };
      password: { new: string; confirm: string };
    };
  }>("/:key", { preValidation }, async (request, reply) => {
    let session: ClientSession | null = null;
    try {
      const { key } = request.params;
      const user = request.user as UserSchema & { id: string };

      const found_user = await User.findOne({ _id: user.id });
      if (!found_user) return reply.code(409).send(JSONResponse("CONFLICT", "cannot update; user does not exist"));

      session = await startSession();
      session.startTransaction();

      switch (key) {
        case "username": {
          if (!request.body.username)
            return reply.code(400).send(JSONResponse("BAD_REQUEST", "username is required on the request body"));

          if (await User.exists({ username: request.body.username }))
            return reply.code(409).send(JSONResponse("CONFLICT", "username already exist"));

          await User.updateOne(
            { _id: user.id },
            { $set: { username: request.body.username, last_updated: new Date() } },
            { session }
          );

          break;
        }

        case "display_name": {
          if (!request.body.display_name)
            return reply.code(400).send(JSONResponse("BAD_REQUEST", "display_name is required on the request body"));

          await User.updateOne(
            { _id: user.id },
            {
              $set: { display_name: request.body.display_name, last_updated: new Date() },
            },
            { session }
          );

          break;
        }
        case "password": {
          if (!request.body.password)
            return reply.code(400).send(JSONResponse("BAD_REQUEST", "password is required on the request body"));

          if (request.body.password.new !== request.body.password.confirm)
            return reply.code(400).send(JSONResponse("BAD_REQUEST", "new password is not the same"));

          await User.updateOne(
            { _id: user.id },
            {
              $set: {
                password: await hash(request.body.password.new, 14),
                last_updated: new Date(),
              },
            },
            { session }
          );

          break;
        }
        case "photo": {
          if (!request.body.photo)
            return reply.code(400).send(JSONResponse("BAD_REQUEST", "photo is required on the request body"));

          if (await Photo.findOne({ _id: request.body.photo.id })) {
            await User.updateOne(
              { _id: user.id },
              { $set: { photo: request.body.photo.id, last_updated: new Date() } },
              { session }
            );
            await Photo.updateOne(
              {
                _id: request.body.photo.id,
              },
              { $set: { date_created: new Date() } },
              { session }
            );
          } else {
            if ((await Photo.countDocuments({ owner: user.id, type: "PROFILE" })) > 4) {
              const last_photo = await Photo.findOne().sort({ date_created: 1 }).select("_id");

              await Photo.deleteOne({ _id: last_photo?.id }, { session });
            }

            const new_photo = new Photo({
              owner: user.id,
              type: "PROFILE",
              ...request.body.photo,
            });

            await new_photo.save({ session });

            await User.updateOne(
              { _id: user.id },
              { $set: { photo: new_photo._id, last_updated: new Date() } },
              { session }
            );
          }

          break;
        }
        default: {
          return reply.code(400).send(JSONResponse("BAD_REQUEST", "request parameter mus be a key of User"));
        }
      }

      await session.commitTransaction();
      await session.endSession();

      return reply.code(200).send(JSONResponse("OK", "user " + key + " is updated"));
    } catch (error) {
      await session?.abortTransaction();
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  fastify.patch<{ Body: { email: string; password: string[]; pin: string } }>("/recover", async (request, reply) => {
    let session: ClientSession | null = null;

    try {
      const { email, password, pin } = request.body;
      if (!email) return reply.code(400).send(JSONResponse("BAD_REQUEST", "email is required on the request body"));
      if (!password)
        return reply.code(400).send(JSONResponse("BAD_REQUEST", "password is required on the request body"));
      if (!pin) return reply.code(400).send(JSONResponse("BAD_REQUEST", "otp is required on the request body"));

      if (password[0] !== password[1])
        return reply.code(400).send(JSONResponse("BAD_REQUEST", "password is not the same"));

      if (!(await OTP.exists({ email, pin, type: "RECOVER" })))
        return reply.code(401).send(JSONResponse("UNAUTHORIZED", "invalid otp"));

      session = await startSession();
      session.startTransaction();

      console.log("PASSWORD::", password);
      await User.updateOne(
        { email },
        { $set: { password: await hash(password[0], 14), last_updated: new Date() } },
        { session }
      );

      await OTP.deleteOne({ email, type: "RECOVER" }, { session });

      await session.commitTransaction();
      await session.endSession();

      return reply.code(200).send(JSONResponse("OK", "password changed"));
    } catch (error) {
      await session?.abortTransaction();
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  //delete
  const upload_thing_api = new UTApi({});

  fastify.delete("/", { preValidation }, async (request, reply) => {
    let session: ClientSession | null = null;

    try {
      const user = request.user as { id: string };
      if (!(await User.findOne({ _id: user.id })))
        return reply.code(200).send(JSONResponse("OK", "user already not exist"));

      session = await startSession();
      session.startTransaction();

      const found_photos = await Photo.find({ owner: user.id, type: "PROFILE" });

      for (const photo of found_photos) {
        await Photo.deleteOne({ _id: photo._id }, { session });
        if (photo.key) await upload_thing_api.deleteFiles(photo.key);
      }

      await User.deleteOne({ _id: user.id }, { session });

      await session.commitTransaction();
      await session.endSession();
    } catch (error) {
      await session?.abortTransaction();

      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });
  done();
}
