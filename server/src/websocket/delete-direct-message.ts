import { WebSocket } from "ws";
import makeMessage from "./make-message";
import { Message } from "@prisma/client";

export default function deleteDirectMessage(
  payload: Message,
  online: Map<string, WebSocket>
) {
  online
    .get(payload.receiver_id)
    ?.send(makeMessage("delete-direct-message", "message deleted"));
}
