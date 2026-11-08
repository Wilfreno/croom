import { Message } from "./entity.types";

export interface ServerToClientEvents {
  ERROR: (error: string) => void;
  MESSAGE: (message: Message) => void;
}

export interface ClientToServerEvents {}

export interface SocketData {
  userId: string;
}
