import { FastifyInstance, FastifyPluginOptions } from "fastify";
import User from "src/database/models/User";
import websocketMessage from "./websocket-message";
import {
  UserLobbyPayload,
  WebSocketMessage,
} from "src/lib/types/websocket-types";
import WebSocket from "ws";
import Lobby from "src/database/models/Lobby";
import Member from "src/database/models/Member";

export default async function messageEventListener(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & {
    lobby_online_user: Map<string, Set<string>>;
    online_user: Map<string, WebSocket>;
  }
) {
  const { lobby_online_user, online_user } = options;

  fastify.get<{ Params: { user_id: string } }>(
    "/ws/:user_id",
    { websocket: true },
    async (socket, request) => {
      const { user_id } = request.params;

      const found_user = await User.exists({ _id: user_id }).select("_id");

      if (!found_user) {
        socket.send(websocketMessage("error", "user does not exist"));
        socket.close();
        return;
      }
      await User.updateOne(
        { _id: user_id },
        {
          $set: { status: "ONLINE" },
        }
      );
      online_user.set(user_id, socket);

      socket.on("message", async (raw_data) => {
        const parsed_message: WebSocketMessage = JSON.parse(
          raw_data.toString()
        );

        switch (parsed_message.type) {
          case "join-lobby": {
            const { user_id, lobby_id } =
              parsed_message.payload as UserLobbyPayload;

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
                .send(
                  websocketMessage(
                    "error",
                    "you are not a member of this lobby"
                  )
                );
              return;
            }

            lobby_online_user.get(lobby_id)!.add(user_id);
            lobby_online_user.get(lobby_id)!.forEach((user) => {
              if (user !== user_id)
                online_user
                  .get(user)
                  ?.send(websocketMessage("user-joined", user_id));
            });
            break;
          }
          case "leave": {
            const { user_id, lobby_id } =
              parsed_message.payload as UserLobbyPayload;

            if (!lobby_online_user.get(lobby_id)) return;

            lobby_online_user.get(lobby_id)!.delete(user_id);

            if (!lobby_online_user.get(lobby_id)!.size) {
              lobby_online_user.delete(lobby_id);
              return;
            }

            lobby_online_user.get(lobby_id)!.forEach((user) => {
              online_user.get(user)?.send(websocketMessage("leave", user_id));
            });

            break;
          }
          default: {
            socket.send(websocketMessage("error", "invalid payload type"));
          }
        }
      });
      socket.on("close", async () => {
        await User.updateOne(
          { _id: user_id },
          {
            $set: { status: "OFFLINE" },
          }
        );
        online_user.delete(user_id);
      });
      socket.on("error", async () => {
        online_user.delete(user_id);
        socket.close();
      });
    }
  );
}
