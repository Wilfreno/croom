import { DirectMessageType } from "src/lib/types/websocket-types";
import makeMessage from "./make-message";
import { WebSocket } from "ws";

export default function sendDirectMessage(
  receiver: string,
  payload: DirectMessageType,
  online: Map<string, WebSocket>
) {
  online.get(receiver)?.send(makeMessage("send-direct-message", payload));
}
