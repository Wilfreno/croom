import { FastifyInstance, FastifyPluginOptions } from "fastify";
import User from "../database/models/User";
import { WebSocket } from "@fastify/websocket";
import websocketMessage from "../lib/websocket-message";
import redisServer from "./redis-server";

const online_users = new Map<string, WebSocket>();

export default async function websocketServer(fastify: FastifyInstance, _: FastifyPluginOptions) {
  fastify.get<{ Params: { user_id: string } }>("/ws/:user_id", { websocket: true }, async (socket, request) => {
    const { user_id } = request.params;

    online_users.set(user_id, socket);

    try {
      const found_user = await User.exists({ _id: user_id }).select("_id");

      if (!found_user) {
        socket.send(websocketMessage("error", "user does not exist"));
        socket.close();
        return;
      }
      await User.updateOne(
        { _id: user_id },
        {
          $set: { status: "ONLINE", last_online: new Date() },
        }
      );
    } catch (error) {
      await User.updateOne(
        { _id: user_id },
        {
          $set: { status: "OFFLINE", last_online: new Date() },
        }
      );
      online_users.delete(user_id);
      socket.close();
    }

    socket.on("close", async () => {
      await User.updateOne(
        { _id: user_id },
        {
          $set: { status: "OFFLINE", last_online: new Date() },
        }
      );
      online_users.delete(user_id);
    });

    socket.on("error", async () => {
      await User.updateOne(
        { _id: user_id },
        {
          $set: { status: "OFFLINE" },
        }
      );

      online_users.delete(user_id);
      socket.close();
    });
  });
  fastify.register(redisServer, { online_users: online_users });
}
