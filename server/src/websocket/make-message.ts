import {
  WebSocketMessage,
  WebSocketPayloadType,
} from "src/lib/types/websocket-types";

export default function createMessage(
  type: WebSocketMessage["type"],
  payload: WebSocketPayloadType
): string {
  return JSON.stringify({
    type,
    payload: payload,
  });
}
