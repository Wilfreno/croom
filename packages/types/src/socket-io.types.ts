import { UserStatus } from "@repo/enums";
import { MessagePayload } from "./entity.types";

export interface UserStatusPayload {
  userId: string;
  status: UserStatus;
  lastOnline: string;
}

export interface CallPayload {
  conversationId: string;
}

export interface IncomingCallPayload {
  conversationId: string;
  caller: {
    id: string;
    displayName: string;
    photoUrl: string | null;
  };
}

export interface ServerToClientEvents {
  ERROR: (error: string) => void;
  MESSAGE: (message: MessagePayload) => void;
  USER_STATUS: (payload: UserStatusPayload) => void;
  INCOMING_CALL: (payload: IncomingCallPayload) => void;
}

export interface ClientToServerEvents {
  CALL: (payload: CallPayload) => void;
}

export interface SocketData {
  userId: string;
}
