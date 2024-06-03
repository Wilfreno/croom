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
  | FriendRequestMessageType
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

export type FriendRequestMessageType = {
  sender: Omit<User, "password">;
  receiver: Omit<User, "password">;
  created_at: Date;
};

export type DirectMessageType = {
  type: "text" | "photo" | "video";
  content: string;
};
