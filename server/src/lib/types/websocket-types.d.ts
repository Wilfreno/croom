import {
  FriendRequest,
  PhotoMessage,
  Room,
  TextMessage,
  User,
  VideoMessage,
} from "@prisma/client";

export type WebsocketClientMessage = {
  type: WebsokcetMessageType;
  payload?: WebSocketPayloadType;
  room_id?: Room["id"];
  sender?: User["id"];
  receiver?: User["id"];
};

export type WebSocketSeverMessage = {
  type: WebsokcetMessageType;
  payload: WebSocketPayloadType;
};

export type WebSocketPayloadType =
  | string
  | NotificationType
  | Omit<User, "password">
  | DirectMessageType;

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

export type NotificationType = {
  type: "friend-request" | undefined;
  content: FriendRequest | undefined;
  message: string;
};

export type DirectMessageType = {
  type: "text" | "photo" | "video";
  content: string;
};
