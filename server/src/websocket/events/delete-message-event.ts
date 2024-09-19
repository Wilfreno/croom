import { WebSocket } from "@fastify/websocket";
import { ChatPayload, MessagePayload } from "src/lib/types/websocket-types";
import websocketMessage from "../websocket-message";

export default async function deleteMessage(
  payload: MessagePayload,
  chats: Map<string, ChatPayload>,
  online: Map<string, WebSocket>
) {
  if (!chats.get(payload.chat.id)) return;

  chats.get(payload.chat.id)!.messages.delete(payload.id);

  chats.get(payload.chat.id)?.online.forEach((user) => {
    if (user !== payload.sender.id)
      online.get(user)?.send(websocketMessage("delete-message", payload));
  });
}
