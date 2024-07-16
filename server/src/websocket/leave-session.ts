import { Session, User } from "@prisma/client";
import {
  WebsocketRoomSessionType,
  WebsocketUserType,
} from "src/lib/types/websocket-types";
import createMessage from "./make-message";

export default function leaveSession(
  session: Map<Session["id"], Map<User["id"], WebsocketUserType>>,
  payload: WebsocketRoomSessionType
) {
  if (
    !session.has(payload.session.id) ||
    session.get(payload.session.id)?.size === 0
  )
    return;

  const current_user = session
    .get(payload.session.id)
    ?.get(payload.room_member.id);

  session.get(payload.session.id)?.delete(payload.room_member.id);

  if (session.get(payload.session.id)?.size === 0)
    session.delete(payload.session.id);

  session.get(payload.session.id)?.forEach((member) => {
    if (member.id !== current_user?.id)
      member.websocket?.send(createMessage("leave-session", current_user!));
  });
}
