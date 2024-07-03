import { Notification, User } from "@prisma/client";
import { WebsocketUserType } from "src/lib/types/websocket-types";
import createMessage from "./make-message";

export default function sendNotification(
  payload: Notification,
  online: Map<User["id"], WebsocketUserType>
) {
  if (!online.has(payload.owner_id)) return;

  online
    .get(payload.owner_id)
    ?.websocket?.send(createMessage("notification", payload));
}
