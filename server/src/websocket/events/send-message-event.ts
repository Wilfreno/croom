import { WebSocket } from "@fastify/websocket";
import Member from "../../database/models/Member";
import { ChatPayload, MessagePayload } from "../../lib/types/websocket-types";
import websocketMessage from "../websocket-message";
import Message, {
  type Message as MessageType,
} from "../../database/models/Message";
import MessageBuffer from "../../lib/classes/message-buffer";

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

    chats.set(payload.chat.id, {
      online: new Map(),
      messages: new MessageBuffer(
        found_messages.map((message) => {
          const msg = message.toJSON() as unknown as MessageType & {
            id: string;
          };

          return {
            ...msg,
            chat: { id: payload.chat.id },
            sender: { id: msg.sender.toString() },
          };
        })
      ),
    });
  }

  chats.get(payload.chat.id)!.messages.insert(payload);
  chats.get(payload.chat.id)!.online.forEach((user) => {
    if (user !== payload.sender.id)
      online.get(user)?.send(websocketMessage("send-message", payload));
  });
}
