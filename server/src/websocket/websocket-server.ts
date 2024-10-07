import { FastifyInstance } from "fastify";
import User from "../database/models/User";
import { WebSocket } from "@fastify/websocket";
import {
  MessagePayload,
  UserLobbyPayload,
  WebSocketMessage,
  WebsocketNotification,
} from "../lib/types/websocket-types";
import websocketMessage from "./websocket-message";
import joinChat from "./events/join-event";
import leaveLobby from "./events/leave-event";
const lobby_online_user = new Map<string, Set<string>>();
const online_user = new Map<string, WebSocket>();

export default async function websocketServer(fastify: FastifyInstance) {
  try {
    const redis = fastify.redis;
    redis["sub"].subscribe("MESSAGE");
    redis["sub"].subscribe("NOTIFICATION");

    redis["sub"].on("message", async (channel, message) => {
      switch (channel) {
        case "MESSAGE": {
          const parsed_message = JSON.parse(message) as MessagePayload;
          switch (parsed_message.status) {
            case "UPDATED": {
              break;
            }
            case "DELETED": {
              if (!lobby_online_user.get(parsed_message.lobby.id)) return;

              lobby_online_user
                .get(parsed_message.lobby.id)!
                .forEach((user) => {
                  if (user !== parsed_message.sender.id)
                    online_user
                      .get(user)
                      ?.send(
                        websocketMessage("delete-message", parsed_message)
                      );
                });
              break;
            }
            default: {
              if (!lobby_online_user.get(parsed_message.lobby.id)) return;
              lobby_online_user.get(parsed_message.id)!.forEach((user) => {
                if (user !== parsed_message.sender.id)
                  online_user
                    .get(user)
                    ?.send(websocketMessage("send-message", parsed_message));
              });
              break;
            }
          }
          break;
        }
        case "NOTIFICATION": {
          const parsed_message = JSON.parse(message) as WebsocketNotification;

          if (!online_user.has(parsed_message.receiver)) return;

          online_user
            .get(parsed_message.receiver)!
            .send(websocketMessage("notification", parsed_message));
          break;
        }
        default:
          break;
      }
    });

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

        console.log("USERS::", online_user.size);
        socket.on("message", async (raw_data) => {
          const parsed_message: WebSocketMessage = JSON.parse(
            raw_data.toString()
          );

          switch (parsed_message.type) {
            case "join": {
              await joinChat(
                parsed_message.payload as UserLobbyPayload,
                lobby_online_user,
                online_user
              );
              break;
            }
            case "leave": {
              await leaveLobby(
                parsed_message.payload as UserLobbyPayload,
                lobby_online_user,
                online_user
              );
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
    throw error;
  }
}
