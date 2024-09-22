import { UserLobbyPayload } from "src/lib/types/websocket-types";
import websocketMessage from "../websocket-message";
import { WebSocket } from "@fastify/websocket";

export default async function leaveLobby(
  payload: UserLobbyPayload,
  lobby_online_user: Map<string, Set<string>>,
  online_user: Map<string, WebSocket>
) {
  const { user_id, lobby_id: chat_id } = payload;

  if (!lobby_online_user.get(chat_id)) return;

  lobby_online_user.get(chat_id)!.delete(user_id);

  if (!lobby_online_user.get(chat_id)!.size) {
    lobby_online_user.delete(chat_id);
    return;
  }

  lobby_online_user.get(chat_id)!.forEach((user) => {
    online_user.get(user)?.send(websocketMessage("leave", user_id));
  });
}
