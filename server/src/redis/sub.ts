import {
  MessagePayload,
  WebsocketNotification,
} from "../lib/types/websocket-types";
import websocketMessage from "../websocket/websocket-message";
import WebSocket from "ws";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default function redisSub(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & {
    lobby_online_user: Map<string, Set<string>>;
    online_user: Map<string, WebSocket>;
  },
  done: () => void
) {
  const { lobby_online_user, online_user } = options;
  const { redis } = fastify;
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
            if (!lobby_online_user.get(parsed_message.lobby.id.toString()))
              return;

            lobby_online_user.get(parsed_message.lobby.id)!.forEach((user) => {
              if (user !== parsed_message.sender.id)
                online_user
                  .get(user)
                  ?.send(websocketMessage("delete-message", parsed_message));
            });
            break;
          }
          default: {
            if (!lobby_online_user.has(parsed_message.lobby.id)) return;
            lobby_online_user.get(parsed_message.lobby.id)!.forEach((user) => {
              if (user !== parsed_message.sender.id.toString())
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

  done();
}
