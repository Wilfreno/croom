import createMessage from "./make-message";
import {
  WebsocketFriendRequestType,
  WebsocketUserType,
} from "src/lib/types/websocket-types";

export default function acceptFriendRequest(
  payload: WebsocketFriendRequestType,
  online: Map<string, WebsocketUserType>
) {
  if (!online.has(payload.sender.user.id)) return;

  online
    .get(payload.sender.user.id)
    ?.websocket!.send(
      createMessage("online-friend", { user: payload.receiver.user })
    );
  online
    .get(payload.receiver.user.id)
    ?.websocket!.send(
      createMessage("online-friend", { user: payload.sender.user })
    );
}
