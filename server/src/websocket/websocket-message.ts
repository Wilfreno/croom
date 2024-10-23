import {
  WebSocketPayload,
  WebsocketPayloadType,
} from "../lib/types/socketio-types";

export default function websocketMessage(
  type: WebsocketPayloadType,
  payload: WebSocketPayload
): string {
  return JSON.stringify({
    type,
    payload,
  });
}
