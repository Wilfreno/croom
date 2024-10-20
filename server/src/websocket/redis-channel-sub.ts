import {
  MessagePayload,
  WebsocketNotification,
} from "../lib/types/websocket-types";
import websocketMessage from "./websocket-message";
import WebSocket from "ws";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default function redisSub(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & {
    online_user: Map<string, WebSocket>;
  },
  done: () => void
) {
  const { online_user } = options;
  const { redis } = fastify;

  const redis_storage = redis["storage"];
  redis["sub"].subscribe("MESSAGE");
  redis["sub"].subscribe("NOTIFICATION");

  redis["sub"].on("message", async (channel, message) => {
    switch (channel) {
      case "MESSAGE": {
        const parsed_message = JSON.parse(message) as MessagePayload;
        const redis_lobby_key = "online-users-" + parsed_message.lobby.id;

        switch (parsed_message.status) {
          case "UPDATED": {
            break;
          }
          case "DELETED": {
            if (!(await redis_storage.exists(redis_lobby_key))) return;

            await redis_storage.smembers(redis_lobby_key).then((members) =>
              members.forEach((user) => {
                if (user !== parsed_message.sender.id)
                  online_user
                    .get(user)
                    ?.send(websocketMessage("DELETE_MESSAGE", parsed_message));
              })
            );
            break;
          }
          default: {
            if (!(await redis_storage.exists(redis_lobby_key))) return;

            await redis_storage.smembers(redis_lobby_key).then((members) =>
              members.forEach((user) => {
                if (user !== parsed_message.sender.id)
                  online_user
                    .get(user)
                    ?.send(websocketMessage("SEND_MESSAGE", parsed_message));
              })
            );
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
          .send(websocketMessage("NOTIFICATION", parsed_message));
        break;
      }
      default:
        break;
    }
  });

  done();
}
