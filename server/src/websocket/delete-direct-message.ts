import { WebSocket } from "ws";
import createMessage from "./make-message";
import { Message } from "@prisma/client";

export default function deleteDirectMessage(
  payload: Message,
  online: Map<string, WebSocket>
) {
  online
    .get(payload.receiver_id)
    ?.send(createMessage("delete-direct-message", "message deleted"));
}
