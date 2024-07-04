import {
  DirectMessage,
  FriendRequest,
  Lounge,
  LoungeMessage,
  Notification,
  ProfilePhoto,
  Room,
  RoomInvite,
  RoomMember,
  Session,
  SessionMessage,
  User,
} from "@prisma/client";
import sendLoungeMessage from "src/websocket/send-lounge-message";
import { WebSocket } from "ws";

export type WebSocketMessage = {
  type: WebsocketMessageType;
  payload: WebSocketPayloadType;
};

export type WebSocketPayloadType =
  | string
  | WebsocketUserType
  | WebsocketFriendRequestType
  | WebsocketDirectMessageType
  | Notification
  | RoomMember
  | WebsocketLoungeMessageType
  | WebsocketRoomSessionType
  | WebsocketSessionMessageType
  | WebsocketRoomMemberType;

export type WebsocketMessageType =
  | "online-friend"
  | "online-room-member"
  | "offline"
  | "notification"
  | "accept-friend-request"
  | "send-direct-message"
  | "delete-direct-message"
  | "new-room-member"
  | "join-lounge"
  | "leave-lounge"
  | "send-lounge-message"
  | "join-session"
  | "leave-session"
  | "send-session-message"
  | "error";

export type WebsocketFriendRequestType = {
  sender_id: WebsocketUserType["id"];
  receiver_id: WebsocketUserType["id"];
  date_created?: Date;
};

export type WebsocketUserType = {
  id: User["id"];
  user_name: User["user_name"];
  display_name: User["display_name"];
  profile_photo: {
    url: ProfilePhoto["url"];
  };
  websocket?: WebSocket;
};

export interface WebsocketDirectMessageType extends DirectMessage {
  text_message?: TextMessage;
  photo_message?: PhotoMessage;
  video_message?: VideoMessage;
}

export type WebsocketRoomMemberType = RoomMember & WebsocketUserType;

export interface WebsocketLoungeMessageType extends LoungeMessage {
  sender: WebsocketUserType;
  text_message?: TextMessage;
  photo_message?: PhotoMessage;
  video_message?: VideoMessage;
}

export type WebsocketRoomSessionType = {
  room_member: RoomMember;
  session: Session;
};

export interface WebsocketSessionMessageType extends SessionMessage {
  sender: WebsocketUserType;
  text_message?: TextMessage;
  photo_message?: PhotoMessage;
  video_message?: VideoMessage;
}
