import { Lounge, RoomMember, User } from "@prisma/client";
import { prisma } from "../server";
import { WebSocket } from "ws";
import createMessage from "./make-message";
import exclude from "src/lib/exclude";

export default async function newRoomMember(
  lounge: Map<Lounge["id"], Map<User["id"], WebSocket>>,
  payload: RoomMember,
  socket: WebSocket
) {
  try {
    const user = await prisma.user.findFirst({
      where: { id: payload.id },
      select: { display_name: true },
    });

    if (!lounge.has(payload.room_id)) {
      lounge.set(payload.room_id, new Map());
    }
    lounge.get(payload.room_id)?.set(payload.id, socket);

    lounge
      .get(payload.room_id)
      ?.forEach((ws) =>
        ws !== socket
          ? ws.send(
              createMessage(
                "new-room-member",
                user?.display_name + " joins the room"
              )
            )
          : null
      );
  } catch (error) {
    throw error;
  }
}
