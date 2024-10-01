import { WebSocketPayload, WebsocketPayloadType } from "../types/websocket";

export default function websocketMessage(
  type: WebsocketPayloadType,
  payload: WebSocketPayload
): string {
  return JSON.stringify({
    type,
    payload,
  });
}
