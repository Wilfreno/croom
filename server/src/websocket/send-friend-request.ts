import { User } from "@prisma/client";
import makeMessage from "./make-message";
import { WebSocket } from "ws";
import { FriendRequestMessageType } from "src/lib/types/websocket-types";

export default async function sendfriendRequest(
  payload: FriendRequestMessageType,
  online: Map<string, WebSocket>
) {
  if (!online.has(payload.receiver.id)) return;
  online
    .get(payload.receiver.id)
    ?.send(makeMessage("send-friend-request", payload));
}
