import { Lounge, RoomMember, User } from "@prisma/client";
import createMessage from "./make-message";
import { WebsocketUserType } from "src/lib/types/websocket-types";

export default function newRoomMember(
  lounge: Map<Lounge["id"], Map<User["id"], WebsocketUserType>>,
  online: Map<User["id"], WebsocketUserType>,
  payload: RoomMember
) {
  const current_user = online.get(payload.id)!;
  
  if (!lounge.has(payload.room_id)) {
    lounge.set(payload.room_id, new Map());
  }
  lounge.get(payload.room_id)?.set(payload.id, current_user);

  lounge.get(payload.room_id)?.forEach((member) => {
    if (member.id !== current_user.id)
      member.websocket!.send(createMessage("new-room-member", current_user));
  });
}
