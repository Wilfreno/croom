import { User } from "@prisma/client";
import createMessage from "./make-message";
import { WebSocket } from "ws";
import { FriendRequestMessageType } from "src/lib/types/websocket-types";

export default async function sendFriendRequest(
  payload: FriendRequestMessageType,
  online: Map<string, WebSocket>
) {
  if (!online.has(payload.receiver.id)) return;
  online
    .get(payload.receiver.id)
    ?.send(createMessage("send-friend-request", payload));
}
