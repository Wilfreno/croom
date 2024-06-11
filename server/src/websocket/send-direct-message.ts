import {
  DirectMessage,
  PhotoMessage,
  TextMessage,
  VideoMessage,
} from "@prisma/client";
import createMessage from "./make-message";
import { WebsocketUserType } from "src/lib/types/websocket-types";

export default function sendDirectMessage(
  payload: DirectMessage & {
    text_message?: TextMessage;
    photo_message?: PhotoMessage;
    video_message?: VideoMessage;
  },
  online: Map<string, WebsocketUserType>
) {
  online
    .get(payload.receiver_id)
    ?.websocket?.send(createMessage("send-direct-message", payload));
}
