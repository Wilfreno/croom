import { WebSocket } from "@fastify/websocket";
import { MessagePayload } from "../../lib/types/websocket-types";
import websocketMessage from "../websocket-message";

export default async function sendMessage(
  payload: MessagePayload,
  lobby_online_user: Map<string, Set<string>>,
  online: Map<string, WebSocket>
) {
  if (!lobby_online_user.get(payload.lobby.id)?.has(payload.sender.id)) {
    online
      .get(payload.sender.id)!
      .send(
        websocketMessage(
          "error",
          "you cannot send a message to a lobby your not a member in"
        )
      );

    return;
  }

  lobby_online_user.get(payload.id)!.forEach((user) => {
    if (user !== payload.sender.id)
      online.get(user)?.send(websocketMessage("send-message", payload));
  });
}
