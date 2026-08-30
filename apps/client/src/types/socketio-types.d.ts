import { Server } from "socket.io-client";

declare module "fastify" {
  interface FastifyInstance {
    io: Server<ClientToServer, ServerToCLient>;
  }
}

export type ClientToServer = {};

export type ServerToCLient = {
  ERROR: (data: string) => void;
  MESSAGE: (message: MessagePayload) => void;
};
