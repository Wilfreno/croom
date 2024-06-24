import { WebSocketMessage } from "src/lib/types/websocket-types";

export default function createMessage(
  type: WebSocketMessage["type"],
  payload: WebSocketMessage["payload"]
): string {
  return JSON.stringify({
    type,
    payload: payload,
  });
}
