import { FastifyInstance, FastifyPluginOptions } from "fastify";
import Invite, { type Invite as InviteType } from "src/database/models/Invite";
import Lobby from "src/database/models/Lobby";
import Member from "src/database/models/Member";
import Notification from "src/database/models/Notification";
import User from "src/database/models/User";
import JSONResponse from "src/lib/json-response";

export default async function v1InviteRouter(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  const redis_pub = fastify.redis["pub"];

  //create route
  fastify.post<{
    Body: {
      lobby_id: string;
      user_ids: string[];
      expires_in: InviteType["expires_in"];
    };
  }>(
    "/",
    { preValidation: async (request) => await request.jwtVerify() },
    async (request, reply) => {
      try {
        const { lobby_id, user_ids, expires_in } = request.body;
        if (!(await Lobby.exists({ _id: lobby_id })))
          return reply
            .code(404)
            .send(JSONResponse("BAD_REQUEST", "lobby does not exist"));

        if (!(await Member.exists({ user: request.user.id, lobby: lobby_id })))
          return reply
            .code(401)
            .send(
              JSONResponse("UNAUTHORIZED", "you are not a member of the lobby")
            );

        for (const user_id of user_ids) {
          if (!(await User.exists({ _id: user_id })))
            return reply
              .code(404)
              .send(
                JSONResponse(
                  "NOT_FOUND",
                  "user with id: (" + user_id + ") does not exist"
                )
              );
        }

        const chars = "abcdefghijklmnopqrstuvwxyz1234567890";

        let token = "";
        for (let i = 0; i < 10; i++) {
          token += chars[Math.floor(Math.random() * chars.length)];
        }

        const invite = new Invite({
          lobby: lobby_id,
          invited: user_ids,
          token,
          expires_in,
        });
        await invite.save();

        for (const user_id of user_ids) {
          const notification = new Notification({
            lobby: lobby_id,
            receiver: user_id,
            type: "INVITE",
            invite: invite._id,
          });

          await notification.save();
          await redis_pub.publish(
            "NOTIFICATION",
            JSON.stringify(notification.toJSON())
          );
        }

        return reply
          .code(201)
          .send(JSONResponse("CREATED", "invite created", invite.toJSON()));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );

  fastify.post<{ Body: { lobby_id: string; token: string } }>(
    "/accept",
    {
      preValidation: async (request) => await request.jwtVerify(),
    },
    async (request, reply) => {
      try {
        const { lobby_id, token } = request.body;

        if (!lobby_id || !token)
          return reply
            .code(400)
            .send(
              JSONResponse(
                "BAD_REQUEST",
                "lobby_id and token is required on the request body"
              )
            );

        const found_lobby = await Lobby.findOne({ _id: lobby_id });

        if (!found_lobby)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "lobby does not exist"));
        const found_invite = await Invite.findOne({
          lobby: lobby_id,
          token: token.toUpperCase(),
        });

        if (!found_invite)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "invite token does not exist"));

        if (found_lobby.is_private) {
          if (
            !found_invite.invited.some(
              (user_id) => (user_id as unknown as string) === request.user.id
            )
          )
            return reply
              .code(403)
              .send(
                JSONResponse(
                  "FORBIDDEN",
                  "you are not invited on this private lobby"
                )
              );
        }

        await Invite.updateOne(
          {
            lobby: lobby_id,
            token: token.toUpperCase(),
          },
          {
            $set: {
              invited: found_invite.invited.filter(
                (user_id) => (user_id as unknown as string) !== request.user.id
              ),
            },
          }
        );
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //read route

  //update route
  fastify.patch<{ Body: { invite_id: string; user_id: string } }>(
    "/",
    {
      preValidation: async (request) => await request.jwtVerify(),
    },
    async (request, reply) => {
      try {
        const { user_id, invite_id } = request.body;

        const found_invite = await Invite.findOne({ _id: invite_id });
        if (!found_invite)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "lobby invite does not exist"));

        if (
          found_invite.invited.some(
            (id) => (id as unknown as string) === user_id
          )
        )
          return reply
            .code(409)
            .send(JSONResponse("CONFLICT", "user already invited"));

        if (
          !(await Member.exists({
            lobby: found_invite.lobby,
            user: request.user.id,
            role: "ADMIN",
          }))
        )
          return reply
            .code(403)
            .send(
              JSONResponse(
                "FORBIDDEN",
                "you cannot make any changes to this lobby invite"
              )
            );

        await Invite.updateOne(
          { _id: invite_id },
          {
            $push: { invited: user_id },
          }
        );
        const notification = new Notification({
          lobby: found_invite.lobby,
          receiver: user_id,
          type: "INVITE",
          invite: invite_id,
        });

        await notification.save();
        await redis_pub.publish(
          "NOTIFICATION",
          JSON.stringify(notification.toJSON())
        );
        return reply.code(200).send(JSONResponse("OK", "invite sent"));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //delete route
  fastify.delete<{ Body: { invite_id: string } }>(
    "/",
    { preValidation: async (request) => await request.jwtVerify() },
    async (request, reply) => {
      try {
        const { invite_id } = request.body;

        if (!invite_id)
          return reply
            .code(400)
            .send(
              JSONResponse(
                "BAD_REQUEST",
                "invite_id is required on the request body"
              )
            );

        const found_invite = await Invite.findOne({ _id: invite_id });

        if (!found_invite)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "invite does not exist"));

        if (
          !(await Member.exists({
            lobby: found_invite.lobby,
            user: request.user.id,
            role: "ADMIN",
          }))
        )
          return reply
            .code(403)
            .send(
              JSONResponse(
                "FORBIDDEN",
                "you are not authorized to delete the invite"
              )
            );

        await Invite.deleteOne({ _id: invite_id });

        return reply.code(200).send(JSONResponse("OK", "invite deleted"));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  done();
}
