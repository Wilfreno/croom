import WebSocket from "ws";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { MessagePayload, WebsocketNotification } from "../lib/types/websocket-types";
import websocketMessage from "../lib/websocket-message";

export default function redisServer(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & {
    online_users: Map<string, WebSocket>;
  },
  done: () => void
) {
  const { online_users } = options;
  const { redis } = fastify;

  redis["sub"].subscribe("MESSAGE");
  redis["sub"].subscribe("NOTIFICATION");

  redis["sub"].on("message", async (channel, message) => {
    switch (channel) {
      case "MESSAGE": {
        const parsed_message = JSON.parse(message) as MessagePayload;
        parsed_message.conversation.members.forEach((user) => {
          if (user !== parsed_message.sender.id)
            online_users.get(user)?.send(websocketMessage("send-message", parsed_message));
        });
        break;
      }
      //   case "NOTIFICATION": {
      //     const parsed_message = JSON.parse(message) as WebsocketNotification;

      //     if (!online_user.has(parsed_message.receiver)) return;

      //     online_user.get(parsed_message.receiver)!.send(websocketMessage("notification", parsed_message));
      //     break;
      //   }
      default:
        break;
    }
  });

  done();
}
