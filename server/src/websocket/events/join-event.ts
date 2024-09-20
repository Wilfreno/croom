import { WebSocket } from "@fastify/websocket";
import Chat from "src/database/models/Chat";
import websocketMessage from "../websocket-message";
import { UserLobbyPayload } from "src/lib/types/websocket-types";
import Member from "src/database/models/Member";

export default async function joinChat(
  payload: UserLobbyPayload,
  lobby_online_user: Map<string, Set<string>>,
  online_user: Map<string, WebSocket>
) {
  const { user_id, lobby_id } = payload;

  if (!lobby_online_user.get(lobby_id)) {
    if (!(await Chat.exists({ _id: lobby_id }))) {
      online_user
        .get(user_id)!
        .send(websocketMessage("error", "lobby does not exist"));
      return;
    }
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
