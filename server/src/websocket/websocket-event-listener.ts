import { FastifyInstance, FastifyPluginOptions } from "fastify";
import User from "../database/models/User";
import websocketMessage from "./websocket-message";
import {
  PeerConnectionMessage,
  UserLobbyPayload,
  WebSocketMessage,
} from "../lib/types/websocket-types";
import WebSocket from "ws";
import Lobby from "../database/models/Lobby";
import Member from "../database/models/Member";

export default async function messageEventListener(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & {
    online_user: Map<string, WebSocket>;
  }
) {
  try {
    const { online_user } = options;
    const redis = fastify.redis["storage"];

    fastify.get<{ Params: { user_id: string } }>(
      "/ws/:user_id",
      { websocket: true },
      async (socket, request) => {
        const { user_id } = request.params;

        const found_user = await User.exists({ _id: user_id }).select("_id");

        if (!found_user) {
          socket.send(websocketMessage("error", "user does not exist"));
          socket.close();
          return;
        }
        await User.updateOne(
          { _id: user_id },
          {
            $set: { status: "ONLINE" },
          }
        );
        online_user.set(user_id, socket);

        socket.on("message", async (raw_data) => {
          const parsed_message: WebSocketMessage = JSON.parse(
            raw_data.toString()
          );

          switch (parsed_message.type) {
            case "join": {
              const { user_id, lobby_id } =
                parsed_message.payload as UserLobbyPayload;
              const redis_lobby_key = "online-users-" + lobby_id;

              if (!(await redis.exists(redis_lobby_key))) {
                if (!(await Lobby.exists({ _id: lobby_id }))) {
                  online_user
                    .get(user_id)!
                    .send(websocketMessage("error", "lobby does not exist"));
                  return;
                }
              }

              if (!(await Member.exists({ user: user_id }))) {
                online_user
                  .get(user_id)!
                  .send(
                    websocketMessage(
                      "error",
                      "you are not a member of this lobby"
                    )
                  );
                return;
              }

              await redis.sadd(redis_lobby_key, user_id);
              await redis.smembers(redis_lobby_key).then((members) =>
                members.forEach((user) => {
                  if (user !== user_id)
                    online_user
                      .get(user)
                      ?.send(websocketMessage("join", user_id));
                })
              );
              break;
            }
            case "leave": {
              const { user_id, lobby_id } =
                parsed_message.payload as UserLobbyPayload;
              const redis_lobby_key = "online-users-" + lobby_id;

              if (!(await redis.exists(redis_lobby_key))) return;

              await redis.srem(redis_lobby_key, user_id);

              if (!redis.scard(redis_lobby_key)) {
                redis.del(redis_lobby_key);
                return;
              }

              await redis.smembers(redis_lobby_key).then((members) =>
                members.forEach((user) => {
                  online_user
                    .get(user)
                    ?.send(websocketMessage("leave", user_id));
                })
              );

              break;
            }
            case "peer-connect": {
              const payload = parsed_message.payload as PeerConnectionMessage;
              if (!online_user.has(payload.receiver_id)) break;
              online_user
                .get(payload.receiver_id)
                ?.send(websocketMessage("peer-connect", payload));

              break;
            }
            default: {
              socket.send(websocketMessage("error", "invalid payload type"));
            }
          }
        });
        socket.on("close", async () => {
          await User.updateOne(
            { _id: user_id },
            {
              $set: { status: "OFFLINE" },
            }
          );
          online_user.delete(user_id);
        });
        socket.on("error", async () => {
          online_user.delete(user_id);
          socket.close();
        });
      }
    );
  } catch (error) {
    fastify.log.error(error);
    fastify.websocketServer.close();
  }
}
