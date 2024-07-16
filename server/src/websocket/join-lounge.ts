import { Lounge, RoomMember, User } from "@prisma/client";
import createMessage from "./make-message";
import {
  WebsocketRoomMemberType,
  WebsocketUserType,
} from "src/lib/types/websocket-types";

export default function joinLounge(
  lounge: Map<Lounge["id"], Map<User["id"], WebsocketRoomMemberType>>,
  online: Map<User["id"], WebsocketUserType>,
  payload: RoomMember
) {
  const current_user = online.get(payload.id);

  if (!lounge.has(payload.room_id)) {
    lounge.set(payload.room_id, new Map());
  }
  lounge
    .get(payload.room_id)
    ?.set(payload.id, { ...payload, ...current_user! });

  lounge.get(payload.room_id)?.forEach((member) => {
    if (member.id !== current_user?.id) {
      member.websocket!.send(createMessage("join-lounge", current_user!));
      current_user?.websocket?.send(createMessage("join-lounge", member));
    }
  });
  console.log("lounge:: ", lounge.get(payload.room_id));
}
