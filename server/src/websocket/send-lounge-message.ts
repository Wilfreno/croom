import { Lounge, LoungeMessage, User } from "@prisma/client";
import createMessage from "./make-message";
import {
  WebsocketLoungeMessageType,
  WebsocketUserType,
} from "src/lib/types/websocket-types";

export default function sendLoungeMessage(
  lounge: Map<Lounge["id"], Map<User["id"], WebsocketUserType>>,
  payload: WebsocketLoungeMessageType
) {
  lounge.get(payload.lounge_id)?.forEach((member) => {
    if (member.user.id !== payload.sender_id)
      member.websocket!.send(
        createMessage("send-general-lounge-message", payload)
      );
  });
}
