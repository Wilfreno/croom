import { DefaultEventsMap, Socket } from "socket.io";

import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  ClientToServer,
  MessagePayload,
  ServerToCLient,
  WebsocketNotification,
} from "src/lib/types/socketio-types";

export default function redisSub(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & {
    socket: Socket<ClientToServer, ServerToCLient, DefaultEventsMap, unknown>;
  },
  done: () => void
) {
  const { redis } = fastify;
  const { socket } = options;
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
                  socket.to(user).emit("DELETE_MESSAGE", parsed_message);
              })
            );
            break;
          }
          default: {
            if (!(await redis_storage.exists(redis_lobby_key))) return;

            await redis_storage.smembers(redis_lobby_key).then((members) =>
              members.forEach((user) => {
                if (user !== parsed_message.sender.id)
                  socket.to(user).emit("SEND_MESSAGE", parsed_message);
              })
            );
            break;
          }
        }
        break;
      }
      case "NOTIFICATION": {
        const parsed_message = JSON.parse(message) as WebsocketNotification;

        socket.to(parsed_message.receiver).emit("NOTIFICATION", parsed_message);
        break;
      }
      default:
        break;
    }
  });

  done();
}
