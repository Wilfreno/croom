import { Message } from "../database/models/Message";
import { Lobby } from "../database/models/Lobby";
import { User } from "../database/models/User";
import { Notification } from "src/database/models/Notification";

export type WebSocketMessage = {
  type: WebsocketPayloadType;
  payload: WebSocketPayload;
};

export type WebSocketPayload =
  | string
  | UserLobbyPayload
  | MessagePayload
  | WebsocketNotification;

export type WebsocketPayloadType =
  | "join-lobby"
  | "user-joined"
  | "leave"
  | "send-message"
  | "delete-message"
  | "notification"
  | "open-camera"
  | "error";

export interface MessagePayload extends Message {
  status: "UPDATED" | "DELETED";
  id: string;
  lobby: Lobby;
  sender: User;
}

export type UserLobbyPayload = {
  user_id: string;
  lobby_id: string;
};

export interface WebsocketNotification extends Omit<Notification, "receiver"> {
  receiver: string;
}
