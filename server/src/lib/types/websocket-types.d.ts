import { Message } from "src/database/models/Message";
import MessageBuffer from "../classes/message-buffer";

export type WebSocketMessage = {
  type: WebsocketPayloadType;
  payload: WebSocketPayload;
};

export type WebSocketPayload =
  | string
  | UserLobbyPayload
  | MessagePayload
  | LobbyPayload
  | LobbyInfo;

export type WebsocketPayloadType =
  | "join"
  | "leave"
  | "chat-info"
  | "send-message"
  | "delete-message"
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
