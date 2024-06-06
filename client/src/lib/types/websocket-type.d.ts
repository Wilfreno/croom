import { Message, User } from "./client-types";

export type WebsocketClientMessage = {
  type: WebsokcetMessageType;
  payload?: WebSocketPayloadType;
  room_id?: Room["id"];
};

export type WebSocketSeverMessage = {
  type: WebsokcetMessageType;
  payload: WebSocketPayloadType;
};

export type WebSocketPayloadType =
  | string
  | FriendRequestMessageType
  | Omit<User, "password">
  | Message;

export type WebsokcetMessageType =
  | "send-friend-request"
  | "accept-friend-request"
  | "send-direct-message"
  | "delete-direct-message"
  | "error"
  | "success"
  | "online"
  | "offline"
  | "kick"
  | "join"
  | "leave";

export type FriendRequestMessageType = {
  sender: Omit<User, "password">;
  receiver: Omit<User, "password">;
  date_created: Date;
};
