import { FastifyInstance } from "fastify";
import User from "../database/models/User";
import { WebSocket } from "@fastify/websocket";
import {
  MessagePayload,
  UserLobbyPayload,
  WebSocketMessage,
} from "../lib/types/websocket-types";
import websocketMessage from "./websocket-message";
import joinChat from "./events/join-event";
import leaveLobby from "./events/leave-event";
import sendMessage from "./events/send-message-event";
import deleteMessage from "./events/delete-message-event";

const lobby_online_user = new Map<string, Set<string>>();
const online_user = new Map<string, WebSocket>();

export default async function websocketServer(fastify: FastifyInstance) {
  const redis = fastify.redis;

  try {
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

        online_user.set(user_id, socket);

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
            case "send-message": {
              await sendMessage(
                parsed_message.payload as MessagePayload,
                lobby_online_user,
                online_user,
              );
              break;
            }
            case "delete-message": {
              await deleteMessage(
                parsed_message.payload as MessagePayload,
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
        socket.on("error", async () => {
          await redis.hdel("online_user-" + user_id);
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
