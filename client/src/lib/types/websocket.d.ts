import { Message, Notification } from "./server-response-data";

export type WebSocketMessage = {
  type: WebsocketPayloadType;
  payload: WebSocketPayload;
};

export type WebSocketPayload =
  | string
  | UserLobbyPayload
  | Message
  | Notification
  | PeerConnectionMessage
  | UserMedia;

export type WebsocketPayloadType =
  | "join"
  | "USER_MEDIA_STREAM"
  | "peer-connect"
  | "leave"
  | "send-message"
  | "delete-message"
  | "notification"
  | "error";

export type UserLobbyPayload = {
  user_id: string;
  lobby_id: string;
};

export type PeerConnectionMessage = {
  type: "OFFER" | "ANSWER" | "ICE_CANDIDATE";
  data: RTCSessionDescriptionInit | RTCIceCandidate;
  receiver_id: string;
  sender_id: string;
};

export type UserMediaStream = {
  sender_id: string;
  receiver_id?: string;
  lobby_id?: string;
  user_media_stream_id: string;
};
