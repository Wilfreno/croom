import {
  DirectMessage,
  FriendRequest,
  Lounge,
  LoungeMessage,
  Room,
  RoomMember,
  Session,
  User,
} from "@prisma/client";
import sendLoungeMessage from "src/websocket/send-lounge-message";

export type WebsocketClientMessage = {
  type: WebsocketMessageType;
  payload: WebSocketPayloadType;
};

export type WebSocketSeverMessage = {
  type: WebsocketMessageType;
  payload: WebSocketPayloadType;
};

export type WebSocketPayloadType =
  | string
  | FriendRequestMessageType
  | Omit<User, "password">
  | Omit<User, "password">[]
  | DirectMessage
  | RoomMember
  | (LoungeMessage & { sender: Omit<User, "password"> })
  | ({ room_member: RoomMember } & { session: Session });

export type WebsocketMessageType =
  | "send-friend-request"
  | "accept-friend-request"
  | "send-direct-message"
  | "delete-direct-message"
  | "new-room-member"
  | "join-lounge"
  | "leave-lounge"
  | "send-lounge-message"
  | "join-session"
  | "error"
  | "success"
  | "online"
  | "offline"
  | "kick"
  | "leave";

export type FriendRequestMessageType = {
  sender: Omit<User, "password">;
  receiver: Omit<User, "password">;
  date_created: Date;
};
