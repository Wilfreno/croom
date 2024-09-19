import { WebSocket } from "@fastify/websocket";
import Chat from "src/database/models/Chat";
import { ChatPayload, UserChatPayload } from "src/lib/types/websocket-types";
import websocketMessage from "../websocket-message";
import Message, {
  type Message as MessageType,
} from "src/database/models/Message";
import MessageBuffer from "src/lib/classes/message-ring-buffer";

export default async function joinChat(
  payload: UserChatPayload,
  chats: Map<string, ChatPayload>,
  online: Map<string, WebSocket>
) {
  const { user_id, chat_id } = payload;
  const found_chat = await Chat.exists({ _id: chat_id });

  if (!found_chat) {
    online
      .get(user_id)!
      .send(websocketMessage("error", "chat room does not exist"));
    return;
  }

  if (!chats.get(chat_id)) {
    const found_messages = await Message.find({
      chat: chat_id,
    })
      .sort({ created_at: -1 })
      .limit(20);

    chats.set(chat_id, {
      online: new Map(),
      messages: new MessageBuffer(
        found_messages.map((message) => {
          const msg = message.toJSON() as unknown as MessageType & {
            id: string;
          };

          return {
            ...msg,
            chat: { id: chat_id },
            sender: { id: msg.sender.toString() },
          };
        })
      ),
    });
  }

  chats.get(chat_id)!.online.set(user_id, user_id);
  chats.get(chat_id)!.online.forEach((user) => {
    if (user !== user_id)
      online.get(user)?.send(websocketMessage("join", user_id));
  });
  online.get(user_id)?.send(
    websocketMessage("chat-info", {
      online: Array.from(chats.get(chat_id)!.online.values()),
      messages: chats.get(chat_id)!.messages.read(),
    })
  );
}
