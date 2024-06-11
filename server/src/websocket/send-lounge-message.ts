import { Lounge, LoungeMessage, User } from "@prisma/client";
import { WebSocket } from "ws";
import createMessage from "./make-message";

export default async function sendLoungeMessage(
  lounge: Map<Lounge["id"], Map<User["id"], WebSocket>>,
  payload: LoungeMessage & { sender: Omit<User, "password"> }
) {
  try {
    if (!lounge.has(payload.lounge_id)) {
      lounge.set(payload.lounge_id, new Map());
    }

    lounge
      .get(payload.lounge_id)
      ?.forEach((ws, key) =>
        key !== payload.sender_id
          ? ws.send(createMessage("send-lounge-message", payload))
          : null
      );
  } catch (error) {
    throw error;
  }
}
