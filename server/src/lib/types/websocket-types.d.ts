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
  | WebsocketNotification
  | PeerConnectionMessage
  | UserTracks;

export type WebsocketPayloadType =
  | "join"
  | "USER_TRACKS"
  | "peer-connect"
  | "leave"
  | "send-message"
  | "delete-message"
  | "notification"
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

export type PeerConnectionMessage = {
  type: "OFFER" | "ANSWER";
  data: RTCSessionDescriptionInit;
  receiver_id: string;
  sender_id: string;
};

export type UserTracks = {
  sender_id: string;
  lobby_id: string;
  tracks_id: string
};
