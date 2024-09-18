import { WebSocket } from "@fastify/websocket";
import Member from "src/database/models/Member";
import { ChatPayload, MessagePayload } from "src/lib/types/websocket-types";
import websocketMessage from "../websocket-message";
import Message, {
  type Message as MessageType,
} from "src/database/models/Message";

export default async function sendMessage(
  payload: MessagePayload,
  online: Map<string, WebSocket>,
  chats: Map<string, ChatPayload>
) {
  if (
    !(await Member.exists({
      user: payload.sender.id,
      chat: payload.chat.id,
    }))
  ) {
    online
      .get(payload.sender.id)!
      .send(
        websocketMessage(
          "error",
          "you cannot send a message to a chat room your not a member in"
        )
      );

    return;
  }

  if (!chats.get(payload.chat.id)) {
    const found_messages = await Message.find({
      chat: payload.chat.id,
    })
      .sort({ created_at: -1 })
      .limit(20);

    const messages_map = new Map<string, MessagePayload>();
    found_messages.forEach((message) => {
      const msg = message.toJSON() as unknown as MessageType & {
        id: string;
      };
      messages_map.set(msg.id, {
        ...msg,
        chat: { id: payload.chat.id },
        sender: { id: msg.sender.toString() },
      });
    });

    chats.set(payload.chat.id, {
      online: new Map(),
      messages: messages_map,
    });
  }

  chats.get(payload.chat.id)!.messages.set(payload.id, payload);
  chats.get(payload.chat.id)!.online.forEach((user) => {
    if (user !== payload.sender.id)
      online.get(user)?.send(websocketMessage("send-message", payload));
  });
}
