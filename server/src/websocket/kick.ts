import { Room, User } from "@prisma/client";
import makeMessage from "./make-message";
import leaveRoom from "./leave-room";
import { WebSocket } from "ws";

export default function kicked(
  user_id: User["id"],
  room_id: Room["id"],
  rooms: Map<string, Map<string, WebSocket>>
) {
  rooms
    .get(room_id)
    ?.get(user_id)
    ?.send(makeMessage("kick", "you have been kicked out of the room"));
  leaveRoom(user_id, room_id, rooms);
}
