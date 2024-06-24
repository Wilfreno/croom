import {
  WebSocketPayloadType,
  WebsocketMessage,
  WebsocketMessageType,
} from "./types/websocket-type";

export default function websocketMessage(
  type: WebsocketMessageType,
  payload: WebSocketPayloadType
): string {
  return JSON.stringify({
    type,
    payload,
  });
}
