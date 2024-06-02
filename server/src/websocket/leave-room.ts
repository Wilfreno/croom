import { Room, User } from "@prisma/client";
import { prisma } from "../server";
import { WebSocket } from "ws";

export default async function leaveRoom(
  user_id: User["id"],
  room_id: Room["id"],
  rooms: Map<string, Map<string, WebSocket>>
) {
  rooms.get(room_id)?.delete(user_id);
  await prisma.room.update({
    where: { id: room_id },
    data: {
      members: {
        disconnect: {
          id: user_id,
        },
      },
    },
    include: {
      members: true,
    },
  });
}
