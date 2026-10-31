import { MessagePayload } from './payload.types';

export interface ServerToClientEvents {
  ERROR: (error: string) => void;
  MESSAGE: (message: MessagePayload) => void;
}

export interface ClientToServerEvents {}

export interface SocketData {
  userId: string;
}
