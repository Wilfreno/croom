import { FastifyInstance } from "fastify";

export default async function websocketServer(fastify: FastifyInstance) {
  try {
    fastify.websocketServer.on("connection", () => console.log("hello world"));
  } catch (error) {
    fastify.log.error(error);
    throw error;
  }
}
