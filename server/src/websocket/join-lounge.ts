import { Lounge, RoomMember, User } from "@prisma/client";
import { WebSocket } from "ws";
import createMessage from "./make-message";
import { prisma } from "src/server";
import exclude from "src/lib/exclude";

export default async function joinLounge(
  lounge: Map<Lounge["id"], Map<User["id"], WebSocket>>,
  payload: RoomMember,
  socket: WebSocket
) {
  try {
    if (!lounge.has(payload.room_id)) {
      lounge.set(payload.room_id, new Map());
    }
    lounge.get(payload.room_id)?.set(payload.id, socket);

    const users: Omit<User, "password">[] = [];

    for (const user_id of lounge.get(payload.room_id)?.keys()!) {
      users.push(
        exclude(
          (await prisma.user.findFirst({
            where: { id: user_id },
            include: { profile_photo: true },
          })) as User,
          ["password"]
        )
      );
    }
    lounge.get(payload.room_id)?.forEach(async (ws) => {
      ws.send(createMessage("join-lounge", users));
    });
  } catch (error) {
    throw error;
  }
}
