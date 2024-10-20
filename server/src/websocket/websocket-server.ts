import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { WebSocket } from "@fastify/websocket";
import redisSub from "./redis-channel-sub";
import mediasoupServer from "./mediasoup-server";

const online_user = new Map<string, WebSocket>();

export default function websocketServer(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  // redis channel sub listener
  fastify.register(redisSub, { online_user });

  // websocket message event listener
  fastify.register(mediasoupServer, { online_user });

  done();
}
