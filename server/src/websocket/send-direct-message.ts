import createMessage from "./make-message";
import {
  WebsocketDirectMessageType,
  WebsocketUserType,
} from "src/lib/types/websocket-types";

export default function sendDirectMessage(
  payload: WebsocketDirectMessageType,
  online: Map<string, WebsocketUserType>
) {
  online
    .get(payload.receiver_id)
    ?.websocket?.send(createMessage("send-direct-message", payload));
}
