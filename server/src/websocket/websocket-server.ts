import { FastifyInstance } from "fastify";
import { WebSocket } from "@fastify/websocket";
import redisSub from "src/redis/sub";
import messageEventListener from "./websocket-event-listener";

const lobby_online_user = new Map<string, Set<string>>();
const online_user = new Map<string, WebSocket>();

export default async function websocketServer(fastify: FastifyInstance) {
  try {
    // redis channel sub listener
    fastify.register(redisSub, { lobby_online_user, online_user });

    // websocket message event listener
    fastify.register(messageEventListener, { lobby_online_user, online_user });
  } catch (error) {
    fastify.log.error(error);
    fastify.websocketServer.close();
    throw error;
  }
}
