import { Message } from "../database/models/Message";
import MessageBuffer from "../classes/message-buffer";
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
  | "join"
  | "leave"
  | "send-message"
  | "delete-message"
  | "notification"
  | "error";

export interface MessagePayload extends Omit<Message, "lobby" | "sender"> {
  id: string;
  lobby: Lobby & { id: string };
  sender: User & { id: string };
}

export type UserLobbyPayload = {
  user_id: string;
  lobby_id: string;
};

export interface WebsocketNotification extends Omit<Notification, "receiver"> {
  receiver: string;
}
