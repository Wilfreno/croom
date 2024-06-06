import { Message } from "@prisma/client";
import makeMessage from "./make-message";
import { WebSocket } from "ws";

export default function sendDirectMessage(
  payload: Message,
  online: Map<string, WebSocket>
) {
  online
    .get(payload.receiver_id)
    ?.send(makeMessage("send-direct-message", payload));
}
