import createMessage from "./make-message";
import { WebSocket } from "ws";
import { FriendRequestMessageType } from "src/lib/types/websocket-types";

export default async function sendFriendRequest(
  payload: FriendRequestMessageType,
  online: Map<string, WebSocket>
) {
  if (!online.has(payload.receiver.user.id)) return;
  online
    .get(payload.receiver.user.id)
    ?.send(createMessage("send-friend-request", payload));
}
