import { Lounge, RoomMember, User } from "@prisma/client";
import exclude from "../lib/exclude";
import { prisma } from "../server";
import { WebSocket } from "ws";
import createMessage from "./make-message";

export default async function leaveLounge(
  lounge: Map<Lounge["id"], Map<User["id"], WebSocket>>,
  payload: RoomMember
) {
  try {
    if (!lounge.has(payload.room_id) || lounge.get(payload.room_id)?.size === 0)
      return;

    lounge.get(payload.room_id)?.delete(payload.id);

    if (lounge.get(payload.room_id)?.size === 0) {
      lounge.delete(payload.room_id);
      return;
    }
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
      ws.send(createMessage("leave-lounge", users));
    });
  } catch (error) {
    throw error;
  }
}
