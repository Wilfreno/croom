import { Session, User } from "@prisma/client";
import {
  WebsocketSessionMessageType,
  WebsocketUserType,
} from "src/lib/types/websocket-types";
import createMessage from "./make-message";

export default function sendSessionMessage(
  session: Map<Session["id"], Map<User["id"], WebsocketUserType>>,
  payload: WebsocketSessionMessageType
) {
  session.get(payload.session_id)?.forEach((member) => {
    if (member.user.id !== payload.sender_id)
      member.websocket!.send(createMessage("send-session-message", payload));
  });
}
