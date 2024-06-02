import { WebSocket } from "ws";
import makeMessage from "./make-message";

export default function deleteDirectMessage(
  receiver: string,
  online: Map<string, WebSocket>
) {
  online
    .get(receiver)
    ?.send(makeMessage("delete-direct-message", "message deleted"));
}
