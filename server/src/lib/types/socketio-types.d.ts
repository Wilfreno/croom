import { Server } from "socket.io";
import { MessageSchema } from "../../database/models/Message";
import { ConversationSchema } from "src/database/models/Conversation";

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

export interface MessagePayload extends MessageSchema {
  id: string;
  conversation: { id: string; members: string[] };
  sender: { id: string };
}

export interface WebsocketNotification extends Omit<Notification, "receiver"> {
  receiver: string;
}
