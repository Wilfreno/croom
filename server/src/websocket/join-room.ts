import { Room, User } from "@prisma/client";
import { prisma } from "../server";
import makeMessage from "./make-message";
import { type WebSocket } from "ws";

export default async function joinRoom(
  socket: WebSocket,
  room_id: Room["id"],
  user_id: User["id"],
  rooms: Map<string, Map<string, WebSocket>>
) {
  // making new room if room does'nt exist
  if (!rooms.get(room_id)) {
    rooms.set(room_id, new Map());
  }

  //checking if user already in the list and update the database
  if (!rooms.get(room_id)?.get(user_id)) {
    await prisma.room.update({
      where: { id: room_id },
      data: {
        members: {
          connect: {
            id: user_id,
          },
        },
      },
      include: {
        members: true,
      },
    });
  }
  //updating the user connection
  rooms.get(room_id)?.set(user_id, socket);

  socket.send(makeMessage("success", "You joined the room; send a message!"));
}
