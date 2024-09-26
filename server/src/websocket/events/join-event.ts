import { WebSocket } from "@fastify/websocket";
import websocketMessage from "../websocket-message";
import { UserLobbyPayload } from "../../lib/types/websocket-types";
import Member from "../../database/models/Member";
import Lobby from "../../database/models/Lobby";

export default async function joinChat(
  payload: UserLobbyPayload,
  lobby_online_user: Map<string, Set<string>>,
  online_user: Map<string, WebSocket>
) {
  const { user_id, lobby_id } = payload;

  if (!lobby_online_user.get(lobby_id)) {
    if (!(await Lobby.exists({ _id: lobby_id }))) {
      online_user
        .get(user_id)!
        .send(websocketMessage("error", "lobby does not exist"));
      return;
    }

    lobby_online_user.set(lobby_id, new Set<string>());
  }

  if (!(await Member.exists({ user: user_id }))) {
    online_user
      .get(user_id)!
      .send(websocketMessage("error", "you are not a member of this lobby"));
    return;
  }

  lobby_online_user.get(lobby_id)!.add(user_id);
  lobby_online_user.get(lobby_id)!.forEach((user) => {
    if (user !== user_id)
      online_user.get(user)?.send(websocketMessage("join", user_id));
  });
  
}
