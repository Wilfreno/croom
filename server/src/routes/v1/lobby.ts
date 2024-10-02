import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { startSession } from "mongoose";
import Invite from "../../database/models/Invite";
import Lobby, { type Lobby as LobbyType } from "../../database/models/Lobby";
import Member from "../../database/models/Member";
import Message from "../../database/models/Message";
import User, { type User as UserType } from "../../database/models/User";
import JSONResponse from "../../lib/json-response";
import Photo, { type Photo as PhotoType } from "../../database/models/Photo";

export default function v1LobbyRouter(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  //create route

  fastify.post(
    "/",
    { preValidation: async (request) => request.jwtVerify() },
    async (request, reply) => {
      try {
        const session = await startSession();
        session.startTransaction();

        const user = request.user as UserType & { id: string };
        if (!(await User.findOne({ _id: user.id })))
          return reply
            .code(404)
            .send(
              JSONResponse(
                "NOT_FOUND",
                "cannot create a new lobby; user does not exist"
              )
            );

        const lobby = new Lobby({
          name: user.display_name + "'s lobby",
          photo: user.photo,
        });

        const member = new Member({
          lobby: lobby.id,
          user: user.id,
          role: "ADMIN",
        });

        await User.updateOne(
          { _id: user.id },
          { $set: { last_updated: new Date() }, $push: { lobbies: lobby._id } }
        );

        lobby.members.push(member._id);

        await lobby.save({ session });
        await member.save({ session });

        await session.commitTransaction();
        await session.endSession();

        return reply
          .code(201)
          .send(
            JSONResponse("CREATED", "new lobby is created", lobby.toJSON())
          );
      } catch (error) {
        fastify.log.error(error);

        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //read route

  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      const found_lobby = await Lobby.findOne({ _id: id }).populate({
        path: "members",
        populate: {
          path: "user",
          select: "display_name status photo",
          populate: "photo",
        },
      });

      if (!found_lobby)
        return reply
          .code(404)
          .send(JSONResponse("NOT_FOUND", "lobby does not exist"));

      return reply
        .code(200)
        .send(JSONResponse("OK", "request successful", found_lobby.toJSON()));
    } catch (error) {
      fastify.log.error(error);

      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  fastify.get<{ Params: { id: string } }>(
    "/:id/invites",
    { preValidation: async (request) => await request.jwtVerify() },
    async (request, reply) => {
      try {
        const { id } = request.params;

        const found_lobby = await Lobby.exists({ _id: id });
        const user = request.user as UserType & { id: string };

        if (!found_lobby)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "lobby does not exist"));

        if (
          !(await Member.exists({
            lobby: id,
            user: user.id,
            role: "ADMIN",
          }))
        )
          return reply
            .code(403)
            .send(
              JSONResponse("FORBIDDEN", "you are not an admin of this lobby")
            );

        const found_invite = await Invite.find({ lobby: id }).populate({
          path: "invited",
          select: "username display_name photo",
          populate: { path: "photo", select: "url" },
        });

        return reply.code(200).send(
          JSONResponse(
            "OK",
            "request successful",
            found_invite.map((i) => i.toJSON())
          )
        );
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id/messages",
    { preValidation: async (request) => await request.jwtVerify() },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const user = request.user as UserType & { id: string };

        const found_lobby = await Lobby.findOne({ _id: id });

        if (!found_lobby)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "lobby does not exist"));

        if (
          !found_lobby.members.some(
            (user_id) => (user_id as unknown as string) === user.id
          )
        )
          return reply
            .code(403)
            .send(
              JSONResponse("FORBIDDEN", "you are not a member of the lobby")
            );

        const found_messages = await Message.find({ lobby: id })
          .populate({
            path: "sender",
            select: "-password",
            populate: "photo",
          })
          .sort("date_created");

        return reply.code(200).send(
          JSONResponse(
            "OK",
            "request successful",
            found_messages.map((message) => message.toJSON())
          )
        );
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //update route

  fastify.patch<{
    Params: { key: keyof LobbyType };
    Body: LobbyType & { id: string; photo: PhotoType };
  }>(
    "/:key",
    { preValidation: async (request) => await request.jwtVerify() },
    async (request, reply) => {
      try {
        const { key } = request.params;
        const { id, name, is_private, photo } = request.body;
        const user = request.user as UserType & { id: string };

        const found_lobby = await Lobby.findOne({ _id: id });

        if (!found_lobby)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "lobby does not exist"));

        if (!Member.exists({ user: user.id, lobby: id, role: "ADMIN" }))
          return reply
            .code(401)
            .send(
              JSONResponse("UNAUTHORIZED", "user in not an admin of this lobby")
            );

        switch (key) {
          case "name": {
            await Lobby.updateOne(
              { _id: id },
              { $set: { name, last_updated: new Date() } }
            );

            break;
          }
          case "is_private": {
            await Lobby.updateOne(
              { _id: id },
              { $set: { is_private, last_updated: new Date() } }
            );

            break;
          }
          case "photo": {
            if (!photo)
              return reply
                .code(400)
                .send(
                  JSONResponse(
                    "BAD_REQUEST",
                    "photo is required on request body"
                  )
                );

            const new_photo = new Photo({
              owner: photo.owner,
              type: "LOBBY",
              url: photo.url,
            });

            await new_photo.save();
            await Lobby.updateOne(
              { _id: id },
              { $set: { photo: new_photo._id, last_updated: new Date() } }
            );
            if (found_lobby.photo) {
              await Photo.deleteOne({ _id: found_lobby.photo });
            }
            break;
          }
          default:
            return reply
              .code(400)
              .send(
                JSONResponse(
                  "BAD_REQUEST",
                  "only name and visibility(is_private) can be updated"
                )
              );
        }

        return reply.code(200).send(JSONResponse("OK", "lobby is updated"));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //delete route

  fastify.delete<{ Body: { id: string } }>(
    "/",
    {
      preValidation: async (request) => await request.jwtVerify(),
    },
    async (request, reply) => {
      try {
        const { id } = request.body;
        const user = request.user as UserType & { id: string };

        if (!id)
          return reply
            .code(400)
            .send(
              JSONResponse("BAD_REQUEST", "id is required on the request body")
            );

        const found_lobby = await Lobby.findOne({ _id: id });

        if (!found_lobby)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "lobby does not exist"));
        if (
          !(await Member.exists({
            lobby: id,
            member: user.id,
            role: "ADMIN",
          }))
        )
          return reply
            .code(401)
            .send(
              JSONResponse("UNAUTHORIZED", "user cannot delete this lobby")
            );

        await Lobby.deleteOne({ _id: id });
        await Member.deleteMany({ lobby: id });
        return reply.code(200).send(JSONResponse("OK", "lobby deleted"));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  done();
}
