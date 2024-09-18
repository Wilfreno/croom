import { FastifyInstance } from "fastify";
import User from "src/database/models/User";
import { WebSocket } from "@fastify/websocket";
import {
  ChatPayload,
  MessagePayload,
  UserChatPayload,
  WebSocketMessage,
} from "src/lib/types/websocket-types";
import websocketMessage from "./websocket-message";
import joinChat from "./events/join-event";
import leaveChat from "./events/leave-event";
import sendMessage from "./events/send-message-event";
import deleteMessage from "./events/delete-message-event";

const chats = new Map<string, ChatPayload>();
const online = new Map<string, WebSocket>();

export default async function websocketServer(fastify: FastifyInstance) {
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

        online.set(user_id, socket);

        socket.on("message", async (raw_data) => {
          const parsed_message: WebSocketMessage = JSON.parse(
            raw_data.toString()
          );

          switch (parsed_message.type) {
            case "join": {
              await joinChat(
                parsed_message.payload as UserChatPayload,
                chats,
                online
              );
              break;
            }
            case "leave": {
              await leaveChat(
                parsed_message.payload as UserChatPayload,
                chats,
                online
              );
              break;
            }
            case "send-message": {
              await sendMessage(
                parsed_message.payload as MessagePayload,
                online,
                chats
              );
              break;
            }
            case "delete-message": {
              await deleteMessage(
                parsed_message.payload as MessagePayload,
                chats,
                online
              );
              break;
            }
            default: {
              socket.send(websocketMessage("error", "invalid payload type"));
            }
          }
        });
      }
    );
  } catch (error) {
    fastify.log.error(error);
    throw error;
  }
}
