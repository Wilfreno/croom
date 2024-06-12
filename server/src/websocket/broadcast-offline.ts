import { User } from "@prisma/client";
import createMessage from "./make-message";
import { WebSocket } from "ws";

export default function broadCastOffline(
  user_id: User["id"],
  rooms: Map<string, Map<string, WebSocket>>
) {
  1;
  rooms.forEach((room) => {
    if (room.has(user_id)) {
      room.forEach((member) => {
        if (member !== room.get(user_id)) {
          member.send(createMessage("offline", user_id));
        }
      });
    }
  });
}
