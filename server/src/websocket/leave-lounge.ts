import { Lounge, RoomMember, User } from "@prisma/client";
import createMessage from "./make-message";
import { WebsocketUserType } from "src/lib/types/websocket-types";

export default function leaveLounge(
  lounge: Map<Lounge["id"], Map<User["id"], WebsocketUserType>>,
  payload: RoomMember
) {
  if (!lounge.has(payload.room_id) || lounge.get(payload.room_id)?.size === 0)
    return;

  const current_user = lounge.get(payload.room_id)?.get(payload.id);
  lounge.get(payload.room_id)?.delete(payload.id);

  if (lounge.get(payload.room_id)?.size === 0) lounge.delete(payload.room_id);

  lounge.get(payload.room_id)?.forEach(async (member) => {
    if (member.id !== current_user?.id)
      member.websocket!.send(createMessage("leave-lounge", current_user!));
  });
}
