import { ConversationSchema } from "src/database/models/Conversation";
import { UserSchema } from "src/database/models/User";

export type WebSocketMessage = {
  type: WebsocketPayloadType;
  payload: WebSocketPayload;
};

export type WebSocketPayload = string | UserLobbyPayload | MessagePayload | WebsocketNotification;

export type WebsocketPayloadType =
  | "join"
  | "leave"
  | "send-message"
  | "delete-message"
  | "notification"
  | "open-camera"
  | "error";

export interface MessagePayload extends Message {
  status: "UPDATED" | "DELETED";
  id: string;
  conversation: { id: string; members: string[] };
  sender: UserSchema & { id: string };
}

export type UserLobbyPayload = {
  user_id: string;
  lobby_id: string;
};

export interface WebsocketNotification extends Omit<Notification, "receiver"> {
  receiver: string;
}
