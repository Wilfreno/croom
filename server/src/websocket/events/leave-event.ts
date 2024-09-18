import { ChatPayload, UserChatPayload } from "src/lib/types/websocket-types";
import websocketMessage from "../websocket-message";
import { WebSocket } from "@fastify/websocket";

export default async function leaveChat(
  payload: UserChatPayload,
  chats: Map<string, ChatPayload>,
  online: Map<string, WebSocket>
) {
  const { user_id, chat_id } = payload;

  if (!chats.get(chat_id)) return;

  chats.get(chat_id)!.online.delete("user_id");

  if (!chats.get(chat_id) || !chats.get(chat_id)!.online.size) {
    chats.delete(chat_id);
    return;
  }

  chats.get(chat_id)!.online.forEach((user) => {
    online.get(user)?.send(websocketMessage("leave", user_id));
  });
}
