import { Lounge, LoungeMessage, User } from "@prisma/client";
import createMessage from "./make-message";
import { WebsocketUserType } from "src/lib/types/websocket-types";

export default function sendLoungeMessage(
  lounge: Map<Lounge["id"], Map<User["id"], WebsocketUserType>>,
  online: Map<User["id"], WebsocketUserType>,
  payload: LoungeMessage & { sender: WebsocketUserType }
) {
  if (!lounge.has(payload.lounge_id)) {
    lounge.set(payload.lounge_id, new Map());
  }
  lounge
    .get(payload.lounge_id)
    ?.set(payload.sender_id, online.get(payload.sender_id)!);

  lounge.get(payload.lounge_id)?.forEach((member) => {
    if (member.user.id !== payload.sender_id)
      member.websocket!.send(createMessage("send-lounge-message", payload));
  });
}
