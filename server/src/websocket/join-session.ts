import { RoomMember, Session, User } from "@prisma/client";
import { WebSocket } from "ws";
import createMessage from "./make-message";

export default function joinSession(
  session: Map<Session["id"], Map<User["id"], WebSocket>>,
  payload: { room_member: RoomMember } & { session: Session },
  socket: WebSocket
) {
  if (!session.has(payload.session.id)) {
    session.set(payload.session.id, new Map());
  }

  session.get(payload.session.id)?.set(payload.room_member.id, socket);

  session.get(payload.session.id)?.forEach((ws, user_id) => {
    if (user_id !== payload.room_member.id)
      ws.send(createMessage("join-session", payload));
  });
}
