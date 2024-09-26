import { Message } from "src/database/models/Message";
import MessageBuffer from "../classes/message-buffer";
import { Notification } from "src/database/models/Notification";

export type WebSocketMessage = {
  type: WebsocketPayloadType;
  payload: WebSocketPayload;
};

export type WebSocketPayload =
  | string
  | UserLobbyPayload
  | MessagePayload
  | LobbyPayload
  | LobbyInfo
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
  lobby: { id: string };
  sender: { id: string };
}

export type UserLobbyPayload = {
  user_id: string;
  lobby_id: string;
};

export type LobbyPayload = {
  online: Map<string, string>;
  messages: MessageBuffer;
};

export type LobbyInfo = {
  online: string[];
  messages: (MessagePayload | null)[];
};

export interface WebsocketNotification extends Notification {
  id: string;
}
