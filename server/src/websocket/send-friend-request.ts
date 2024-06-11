import createMessage from "./make-message";
import {
  FriendRequestMessageType,
  WebsocketUserType,
} from "src/lib/types/websocket-types";

export default async function sendFriendRequest(
  payload: FriendRequestMessageType,
  online: Map<string, WebsocketUserType>
) {
  if (!online.has(payload.receiver.user.id)) return;
  online
    .get(payload.receiver.user.id)
    ?.websocket!.send(createMessage("send-friend-request", payload));
}
