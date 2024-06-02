import { Room } from "@prisma/client";
import makeMessage from "./make-message";
import { WebSocket } from "ws";

export default function sendMessage(
  sender: WebSocket,
  room_id: Room["id"],
  message: string,
  rooms: Map<string, Map<string, WebSocket>>
) {
  rooms.get(room_id)?.forEach((member) => {
    if (member !== sender && member.readyState === WebSocket.OPEN) {
      member.send(makeMessage("message", message));
    }
  });
}
