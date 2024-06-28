import createMessage from "./make-message";
import {
  WebsocketFriendRequestType,
  WebsocketUserType,
} from "src/lib/types/websocket-types";

export default function acceptFriendRequest(
  payload: WebsocketFriendRequestType,
  online: Map<string, WebsocketUserType>
) {
  if (!online.has(payload.sender_id)) return;

  const sender = online.get(payload.sender_id);

  sender?.websocket!.send(createMessage("online-friend", sender!));

  const receiver = online.get(payload.receiver_id);

  receiver?.websocket!.send(createMessage("online-friend", receiver!));
}
