import { WebSocketSeverMessage } from "src/lib/types/websocket-types";

export default function createMessage(
  type: WebSocketSeverMessage["type"],
  payload: WebSocketSeverMessage["payload"]
): string {
  return JSON.stringify({
    type,
    payload: payload,
  });
}
