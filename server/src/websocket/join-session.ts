import { RoomMember, Session, User } from "@prisma/client";
import createMessage from "./make-message";
import {
  WebsocketRoomSessionType,
  WebsocketUserType,
} from "src/lib/types/websocket-types";

export default function joinSession(
  session: Map<Session["id"], Map<User["id"], WebsocketUserType>>,
  online: Map<User["id"], WebsocketUserType>,
  payload: WebsocketRoomSessionType
) {
  const current_user = online.get(payload.room_member.id);
  if (!session.has(payload.session.id)) {
    session.set(payload.session.id, new Map());
  }

  session.get(payload.session.id)?.set(payload.room_member.id, current_user!);

  session.get(payload.session.id)?.forEach((member) => {
    if (member.user.id !== payload.room_member.id)
      member.websocket!.send(
        createMessage("join-session", { user: current_user?.user! })
      );
  });
}
