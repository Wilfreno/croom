import createMessage from "./make-message";
import {
  WebsocketFriendRequestType,
  WebsocketUserType,
} from "src/lib/types/websocket-types";

export default function sendFriendRequest(
  payload: WebsocketFriendRequestType,
  online: Map<string, WebsocketUserType>
) {
  if (!online.has(payload.receiver.user.id)) return;
  online
    .get(payload.receiver.user.id)
    ?.websocket!.send(createMessage("send-friend-request", payload));
}
