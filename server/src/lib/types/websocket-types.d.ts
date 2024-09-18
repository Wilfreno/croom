import { Message } from "src/database/models/Message";

export type WebSocketMessage = {
  type: WebsocketPayloadType;
  payload: WebSocketPayload;
};

export type WebSocketPayload =
  | string
  | UserChatPayload
  | MessagePayload
  | ChatPayload
  | ChatInfo;

export type WebsocketPayloadType =
  | "join"
  | "leave"
  | "chat-info"
  | "send-message"
  | "delete-message"
  | "error";

export interface MessagePayload extends Omit<Message, "chat" | "sender"> {
  id: string;
  chat: { id: string };
  sender: { id: string };
}

export type UserChatPayload = {
  user_id: string;
  chat_id: string;
};

export type ChatPayload = {
  online: Map<string, string>;
  messages: Map<string, MessagePayload | null>;
};

export type ChatInfo = {
  online: string[];
  messages: (MessagePayload | null)[];
};
