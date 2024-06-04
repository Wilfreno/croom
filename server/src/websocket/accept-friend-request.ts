import { WebSocket } from "ws";
import makeMessage from "./make-message";
import { FriendRequestMessageType } from "src/lib/types/websocket-types";

export default async function acceptFriendrequest(
  payload: FriendRequestMessageType,
  online: Map<string, WebSocket>
) {
  if (!online.has(payload.sender.id)) return;

  online.get(payload.sender.id)?.send(makeMessage("online", payload.receiver));
  online.get(payload.receiver.id)?.send(makeMessage("online", payload.sender));
}
