import { compare, hash } from "bcrypt";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import exclude from "../../lib/exclude";
import JSONResponse from "../../lib/json-response";
import User, { UserSchema } from "../../database/models/User";
import Photo, { PhotoSchema } from "../../database/models/Photo";
import Conversation, { ConversationSchema } from "../../database/models/Conversation";
import { ClientSession, FlattenMaps, startSession, Types } from "mongoose";
import { preValidation } from "src/lib/prevalidation";

export default function v1UserRouter(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  //create user
  fastify.post<{
    Body: {
      username: string;
      password: string;
      email: string;
      display_name: string;
      provider: "GOOGLE" | "CREDENTIALS";
      photo_url: string;
    };
  }>("/", async (request, reply) => {
    let session: ClientSession | null = null;
    try {
      const { username, display_name, password, provider, email, photo_url } =
        request.body;
      if (!username)
        return reply
          .code(400)
          .send(JSONResponse("BAD_REQUEST", "username is required on the request body"));
      if (!email)
        return reply
          .code(400)
          .send(JSONResponse("BAD_REQUEST", "email is required on the request body"));

      if (await User.exists({ email }))
        return reply.code(400).send(JSONResponse("BAD_REQUEST", "email already used"));

      if (!provider)
        return reply
          .code(400)
          .send(
            JSONResponse(
              "BAD_REQUEST",
              'provider is required on the request body with "GOOGLE" or "CREDENTIALS" as its value'
            )
          );

      if (!username.startsWith("@"))
        return reply
          .code(400)
          .send(JSONResponse("BAD_REQUEST", "username must start with @"));

      if (await User.exists({ username }))
        return reply.code(409).send(JSONResponse("CONFLICT", "user already exist"));

      if (provider === "CREDENTIALS" && password.length < 8)
        return reply
          .code(400)
          .send(
            JSONResponse("BAD_REQUEST", "password must be at least 8 characters long")
          );

      session = await startSession();
      session.startTransaction();

      const new_user = new User({
        display_name,
        username,
        password: provider === "CREDENTIALS" ? await hash(password, 14) : null,
        email,
        last_updated: new Date(),
      });

      if (photo_url) {
        const new_photo = new Photo({
          owner: new_user._id,
          type: "PROFILE",
          url: photo_url,
        });
        await new_photo.save({ session });
        new_user.photo = new_photo._id;
      }

      await new_user.save({ session });

      await session.commitTransaction();
      await session.endSession();

      return reply
        .code(201)
        .send(
          JSONResponse(
            "CREATED",
            "new user created",
            exclude(new_user.toJSON(), ["password"])
          )
        );
    } catch (error) {
      await session?.abortTransaction();
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  fastify.post<{
    Body: {
      username: string;
      password: string;
    };
  }>("/auth", async (request, reply) => {
    try {
      const { username, password } = request.body;

      if (!username)
        return reply
          .code(400)
          .send(JSONResponse("BAD_REQUEST", "username is required on the request body"));

      if (!username.startsWith("@"))
        return reply
          .code(400)
          .send(JSONResponse("BAD_REQUEST", "username must start with @"));

      const found_user = await User.findOne({ username }).populate({
        path: "photo",
        select: "url",
      });

      if (!found_user)
        return reply.code(404).send(JSONResponse("NOT_FOUND", "user does not exist"));

      if (!found_user.password)
        return reply
          .code(403)
          .send(
            JSONResponse(
              "FORBIDDEN",
              "you can only login with this account using Google OAuth"
            )
          );

      if (!(await compare(password, found_user.password)))
        return reply.code(401).send(JSONResponse("UNAUTHORIZED", "incorrect password"));

      return reply
        .code(200)
        .send(
          JSONResponse(
            "OK",
            "user authenticated",
            exclude(found_user.toJSON(), ["password"])
          )
        );
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  //read user
  fastify.get<{ Params: { username: string } }>("/:username", async (request, reply) => {
    try {
      const { username } = request.params;

      const found_user = await User.findOne({ username })
        .populate("photo")
        .select("-password");

      if (!found_user)
        return reply.code(404).send(JSONResponse("NOT_FOUND", "user does not exist"));

      return reply
        .code(200)
        .send(JSONResponse("OK", "request successful", found_user.toJSON()));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  fastify.get<{ Querystring: { value: string } }>(
    "/search",
    {
      preValidation,
    },
    async (request, reply) => {
      try {
        const { value } = request.query;
        const user = request.user!;

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
    }
  );
  fastify.get("/conversations", { preValidation }, async (request, reply) => {
    try {
      const user = request.user!;

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
              populate: { path: "sender", select: "_id" },
            },
          })
          .populate({ path: "members", select: "status" });

        if (!found_conversation) continue;

        if (found_conversation.is_group_chat) {
          conversations.push(found_conversation?.toJSON());
        } else {
          conversations.push(
            (
              await found_conversation.populate({
                path: "members",
                match: { _id: { $ne: user.id } },
                select: "_id display_name photo status",
                populate: { path: "photo", select: "url" },
              })
            ).toJSON()
          );
        }
      }

      return reply
        .code(200)
        .send(JSONResponse("OK", "request successful", conversations));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  fastify.get("/active-conversation", { preValidation }, async (request, reply) => {
    try {
      const user = request.user!;

      const conversations = [];

      for (const convo of user.conversations) {
        const found_conversation = await Conversation.findOne({ _id: convo });
        if (!found_conversation) continue;

        for (const member of found_conversation.members) {
          if (member.toString() === user.id) continue;

          const found_member = await User.findOne({ _id: member, status: "ONLINE" });
          if (found_member) {
            if (found_conversation.is_group_chat) {
              conversations.push(
                (
                  await found_conversation.populate({ path: "photo", select: "url" })
                ).toJSON()
              );
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

      return reply
        .code(200)
        .send(JSONResponse("OK", "request successful", conversations));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  //update
  fastify.patch<{
    Params: { id: string; key: keyof UserSchema };
    Body: Omit<UserSchema, "photo"> & {
      photo: PhotoSchema;
      blocked: string;
      blocked_action: "ADD" | "REMOVE";
    };
  }>("/:key", async (request, reply) => {
    let session: ClientSession | null = null;
    try {
      const { id, key } = request.params;
      const { username, display_name, password, photo, status, blocked, blocked_action } =
        request.body;

      const found_user = await User.findOne({ _id: id });
      if (!found_user)
        return reply.code(404).send(JSONResponse("NOT_FOUND", "user does not exist"));

      session = await startSession();
      session.startTransaction();

      switch (key) {
        case "username": {
          if (!username)
            return reply
              .code(400)
              .send(
                JSONResponse("BAD_REQUEST", "username is required on the request body")
              );

          await User.updateOne(
            { _id: id },
            { $set: { username, last_updated: new Date() } },
            { session }
          );

          break;
        }

        case "display_name": {
          if (!display_name)
            return reply
              .code(400)
              .send(
                JSONResponse(
                  "BAD_REQUEST",
                  "display_name is required on the request body"
                )
              );

          await User.updateOne(
            { _id: id },
            { $set: { display_name, last_updated: new Date() } },
            { session }
          );

          break;
        }
        case "password": {
          if (!password)
            return reply
              .code(400)
              .send(
                JSONResponse("BAD_REQUEST", "password is required on the request body")
              );

          await User.updateOne(
            { _id: id },
            {
              $set: {
                password: await hash(password, 14),
                last_updated: new Date(),
              },
            },
            { session }
          );

          break;
        }
        case "photo": {
          if (!photo)
            return reply
              .code(400)
              .send(JSONResponse("BAD_REQUEST", "photo is required on the request body"));

          const new_photo = new Photo({
            owner: found_user._id,
            type: "PROFILE",
            url: photo.url,
          });

          await new_photo.save();

          if (found_user.photo)
            await Photo.deleteOne({ _id: found_user.photo }, { session });

          await User.updateOne(
            { _id: id },
            { $set: { photo: new_photo._id, last_updated: new Date() } },
            { session }
          );

          break;
        }
        case "status": {
          if (!status)
            return reply
              .code(400)
              .send(
                JSONResponse("BAD_REQUEST", "status is required on the request body")
              );

          await User.updateOne(
            { _id: id },
            { $set: { status, last_updated: new Date() } },
            { session }
          );

          break;
        }
        case "blocked": {
          if (!blocked)
            return reply
              .code(400)
              .send(
                JSONResponse("BAD_REQUEST", "blocked is required on the request body")
              );

          switch (blocked_action) {
            case "ADD": {
              if (
                !found_user.blocked.some(
                  (blocked_user) => blocked_user.toString() === blocked
                )
              )
                return reply
                  .code(409)
                  .send(JSONResponse("CONFLICT", "user is already blocked"));

              const found_found_blocked_user = await User.findOne({ _id: blocked });
              if (!found_found_blocked_user)
                return reply
                  .code(404)
                  .send(JSONResponse("NOT_FOUND", "user does not exist"));

              await User.updateOne(
                { _id: id },
                { $push: { blocked: blocked }, last_updated: new Date() },
                { session }
              );
              break;
            }
            case "REMOVE": {
              if (
                found_user.blocked.some(
                  (blocked_user) => blocked_user.toString() === blocked
                )
              )
                return reply
                  .code(409)
                  .send(JSONResponse("CONFLICT", "user is not blocked by you"));

              const found_found_blocked_user = await User.findOne({ _id: blocked });
              if (!found_found_blocked_user)
                return reply
                  .code(404)
                  .send(JSONResponse("NOT_FOUND", "user does not exist"));

              await User.updateOne(
                { _id: id },
                { $pull: { blocked: blocked }, last_updated: new Date() },
                { session }
              );
              break;
            }
          }
          break;
        }
        default: {
          return reply
            .code(400)
            .send(JSONResponse("BAD_REQUEST", "request parameter mus be a key of User"));
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

  //   //delete user

  //   fastify.delete<{ Params: { username: string } }>("/:username", async (request, reply) => {
  //     try {
  //       const { username } = request.params;

  //       const found_user = await User.exists({ username });

  //       if (!found_user) return reply.code(404).send(JSONResponse("CONFLICT", " cannot delete user user does not exist"));

  //       await User.deleteOne({ username });

  //       return reply.code(200).send(JSONResponse("OK", "user deleted"));
  //     } catch (error) {
  //       fastify.log.error(error);
  //       return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
  //     }
  //   });

  fastify.delete(
    "/session",
    {
      preValidation,
    },
    async (_, reply) => {
      try {
        return reply
          .code(200)
          .setCookie("chatup-session-token", "", {
            domain:
              process.env.NODE_ENV === "production" ? "chatup.vercel.app" : "127.0.0.1",
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            httpOnly: true,
            maxAge: 0,
          })
          .send(JSONResponse("OK", "user session is created"));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  done();
}
