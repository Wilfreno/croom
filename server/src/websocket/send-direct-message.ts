import { Message } from "@prisma/client";
import createMessage from "./make-message";
import { WebSocket } from "ws";

export default function sendDirectMessage(
  payload: Message,
  online: Map<string, WebSocket>
) {
  online
    .get(payload.receiver_id)
    ?.send(createMessage("send-direct-message", payload));
}
