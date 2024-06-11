import {
  DirectMessage,
  FriendRequest,
  Lounge,
  LoungeMessage,
  ProfilePhoto,
  Room,
  RoomMember,
  Session,
  User,
} from "@prisma/client";
import sendLoungeMessage from "src/websocket/send-lounge-message";
import { WebSocket } from "ws";

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
  | RoomMember
  | WebsocketFriendRequestType
  | WebsocketUserType
  | WebsocketDirectMessageType
  | WebsocketLoungeMessageType
  | WebsocketRoomSessionType;

export type WebsocketMessageType =
  | "online-friend"
  | "online-room-member"
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
  | "offline"
  | "kick"
  | "leave";

export type WebsocketFriendRequestType = {
  sender: WebsocketUserType;
  receiver: WebsocketUserType;
  date_created: Date;
};

export type WebsocketUserType = {
  user: {
    id: User["id"];
    user_name: User["user_name"];
    display_name: User["display_name"];
    profile_photo: {
      photo_url: ProfilePhoto["photo_url"];
    };
  };
  websocket?: WebSocket;
};

export interface WebsocketDirectMessageType extends DirectMessage {
  text_message?: TextMessage;
  photo_message?: PhotoMessage;
  video_message?: VideoMessage;
}

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
