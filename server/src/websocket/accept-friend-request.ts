import { WebSocket } from "ws";
import createMessage from "./make-message";
import { FriendRequestMessageType } from "src/lib/types/websocket-types";

export default async function acceptFriendRequest(
  payload: FriendRequestMessageType,
  online: Map<string, WebSocket>
) {
  if (!online.has(payload.sender.id)) return;

  online
    .get(payload.sender.id)
    ?.send(createMessage("online", payload.receiver));
  online
    .get(payload.receiver.id)
    ?.send(createMessage("online", payload.sender));
}
