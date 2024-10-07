import { Message, Notification } from "./server";

export type WebSocketMessage = {
  type: WebsocketPayloadType;
  payload: WebSocketPayload;
};

export type WebSocketPayload =
  | string
  | UserLobbyPayload
  | Message
  | Notification;

export type WebsocketPayloadType =
  | "join"
  | "leave"
  | "send-message"
  | "delete-message"
  | "notification"
  | "error";

export type UserLobbyPayload = {
  user_id: string;
  lobby_id: string;
};
