import { FastifyInstance, FastifyPluginOptions } from "fastify";
import Invite, {
  type Invite as InviteType,
} from "../../database/models/Invite";
import Lobby from "../../database/models/Lobby";
import Member from "../../database/models/Member";
import Notification from "../../database/models/Notification";
import { type User as UserType } from "../../database/models/User";
import JSONResponse from "../../lib/json-response";

export default function v1InviteRouter(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  const redis_pub = fastify.redis["pub"];

  //create route
  fastify.post<{
    Body: {
      lobby_id: string;
    };
  }>(
    "/",
    { preValidation: async (request) => await request.jwtVerify() },
    async (request, reply) => {
      try {
        const { lobby_id } = request.body;
        const user = request.user as UserType & { id: string };

        if (!lobby_id)
          return reply
            .code(400)
            .send(
              JSONResponse(
                "BAD_REQUEST",
                "lobby_id is required on the request body"
              )
            );

        if (!(await Lobby.exists({ _id: lobby_id })))
          return reply
            .code(404)
            .send(JSONResponse("BAD_REQUEST", "lobby does not exist"));

        if (
          !(await Member.exists({
            user: user.id,
            lobby: lobby_id,
            role: "ADMIN",
          }))
        )
          return reply
            .code(401)
            .send(
              JSONResponse("UNAUTHORIZED", "you are not an admin of this lobby")
            );

        const chars = "abcdefghijklmnopqrstuvwxyz1234567890";

        let token = "";
        for (let i = 0; i < 10; i++) {
          token += chars[Math.floor(Math.random() * chars.length)];
        }

        const invite = new Invite({
          lobby: lobby_id,
          token,
        });

        await invite.save();

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
        const user = request.user as UserType & { id: string };

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
            !found_invite
              .toJSON()
              .invited.some(
                (user_id) => (user_id as unknown as string) === user.id
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
              invited: found_invite
                .toJSON()
                .invited.filter(
                  (user_id) => (user_id as unknown as string) !== user.id
                ),
            },
          }
        );

        return reply.code(200).send(JSONResponse("OK", "invite accepted"));
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

      const found_invite = await Invite.findOne({ _id: id }).populate({
        path: "lobby",
        select: "name photo",
        populate: {
          path: "photo",
          select: "url",
        },
      });

      if (!found_invite)
        return reply
          .code(404)
          .send(JSONResponse("NOT_FOUND", "invite does not exist"));

      return reply
        .code(200)
        .send(JSONResponse("OK", "request successful", found_invite.toJSON()));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });
  //update route
  fastify.patch<{
    Params: { key: keyof InviteType };
    Body: {
      id: string;
      invited: string;
      expires_in: number;
      action: "DELETE" | "ADD";
    };
  }>(
    "/:key",
    {
      preValidation: async (request) => await request.jwtVerify(),
    },
    async (request, reply) => {
      try {
        const { key } = request.params;
        const { id, invited, expires_in, action } = request.body;
        const user = request.user as UserType & { id: string };

        if (!id)
          return reply
            .code(400)
            .send(
              JSONResponse("BAD_REQUEST", "id is required on the request body")
            );
        const found_invite = await Invite.findOne({ _id: id });

        if (!found_invite)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "lobby invite does not exist"));

        if (
          !(await Member.exists({
            lobby: found_invite.lobby,
            user: user.id,
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

        switch (key) {
          case "invited": {
            if (!invited)
              return reply
                .code(400)
                .send(
                  JSONResponse(
                    "BAD_REQUEST",
                    "invited is required on the request body"
                  )
                );

            if (!action)
              return reply
                .code(400)
                .send(
                  JSONResponse(
                    "BAD_REQUEST",
                    "action field with value ADD or DELETE is required on the request body"
                  )
                );

            switch (action) {
              case "ADD": {
                for (let i = 0; i < found_invite.invited.length / 2; i++) {
                  if (
                    invited ===
                      (found_invite.invited[i].toJSON() as unknown as string) ||
                    invited ===
                      (found_invite.invited[
                        found_invite.invited.length - i - 1
                      ].toJSON() as unknown as string)
                  )
                    return reply
                      .code(409)
                      .send(
                        JSONResponse(
                          "CONFLICT",
                          "user already invited",
                          found_invite
                        )
                      );
                }

                await Invite.updateOne(
                  { _id: id },
                  {
                    $push: { invited: invited },
                    $set: { last_updated: new Date() },
                  }
                );

                const notification = new Notification({
                  lobby: found_invite.lobby,
                  receiver: invited,
                  type: "INVITE",
                  invite: id,
                });

                await notification.save();
                await redis_pub.publish(
                  "NOTIFICATION",
                  JSON.stringify(notification.toJSON())
                );
                return reply.code(200).send(JSONResponse("OK", "invite sent"));
              }
              case "DELETE": {
                await Invite.updateOne(
                  { _id: id },
                  {
                    $set: {
                      invited: found_invite
                        .toJSON()
                        .invited.filter(
                          (user) => (user as unknown as string) !== invited
                        ),
                      last_updated: new Date(),
                    },
                  }
                );
                return reply
                  .code(200)
                  .send(JSONResponse("OK", "invite deleted"));
              }
              default:
                break;
            }

            break;
          }
          case "expires_in": {
            if (expires_in !== null) {
              if (!Number(expires_in))
                return reply
                  .code(400)
                  .send(
                    JSONResponse(
                      "BAD_REQUEST",
                      "expires_in must be a valid number or set to null to make it permanent"
                    )
                  );
            }
            const ms = expires_in * 1000;
            await Invite.updateOne(
              { _id: id },
              {
                $set: {
                  expires_in: new Date(ms + new Date().getTime()),
                  last_updated: new Date(),
                },
              }
            );
            return reply
              .code(200)
              .send(JSONResponse("OK", "expiration updated"));
          }
          default:
            return reply
              .code(400)
              .send(
                JSONResponse(
                  "BAD_REQUEST",
                  "only field invited and expires_in is available to update"
                )
              );
        }
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //delete route
  fastify.delete<{ Body: { id: string } }>(
    "/",
    { preValidation: async (request) => await request.jwtVerify() },
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

        const found_invite = await Invite.findOne({ _id: id });

        if (!found_invite)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "invite does not exist"));

        if (
          !(await Member.exists({
            lobby: found_invite.lobby,
            user: user.id,
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

        await Invite.deleteOne({ _id: id });

        return reply.code(200).send(JSONResponse("OK", "invite deleted"));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  done();
}
