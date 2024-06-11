import createMessage from "./make-message";
import { DirectMessage } from "@prisma/client";
import { WebsocketUserType } from "src/lib/types/websocket-types";

export default function deleteDirectMessage(
  payload: DirectMessage,
  online: Map<string, WebsocketUserType>
) {
  online
    .get(payload.receiver_id)
    ?.websocket!.send(createMessage("delete-direct-message", payload));
}
