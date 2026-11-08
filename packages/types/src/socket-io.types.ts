import { UserStatus } from "@repo/enums";
import { MessagePayload } from "./entity.types";

export interface UserStatusPayload {
  userId: string;
  status: UserStatus;
  lastOnline: string;
}

export interface ServerToClientEvents {
  ERROR: (error: string) => void;
  MESSAGE: (message: MessagePayload) => void;
  USER_STATUS: (payload: UserStatusPayload) => void;
}

export interface ClientToServerEvents {}

export interface SocketData {
  userId: string;
}
