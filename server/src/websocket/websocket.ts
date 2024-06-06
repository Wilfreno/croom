import http from "http";
import WebSocket from "ws";
import { Message, User } from "@prisma/client";
import { parse } from "url";
import { prisma } from "../server";
import {
  FriendRequestMessageType,
  WebsocketClientMessage,
} from "src/lib/types/websocket-types";
import makeMessage from "./make-message";
import broadcastOnline from "./broadcast-online";
import sendDirectMessage from "./send-direct-message";
import deleteDirectMessage from "./delete-direct-message";
import sendfriendRequest from "./send-friend-request";
import acceptFriendrequest from "./accept-friend-request";

const members = new Map<User["id"], WebSocket>();
const online = new Map<User["id"], WebSocket>();

export default function WebsocketServer(
  http_server: http.Server<
    typeof http.IncomingMessage,
    typeof http.ServerResponse
  >
) {
  const websocket_server = new WebSocket.Server({ server: http_server });

  websocket_server.on("connection", async (socket, request) => {
    //checking valid url connection
    const params = parse(request.url!, true).query;
    //cheking if there is  user_id query parameter on teh url
    if (!params.user_id) {
      socket.send(
        makeMessage(
          "error",
          "the url connection needs a user_id query parameter"
        )
      );
      socket.close();
      return;
    }
    const user = await prisma.user.findFirst({
      where: { id: params.user_id! as string },
    });

    //closing connection if user does not exist
    if (!user) {
      socket.send(makeMessage("error", "user does not exist"));
      socket.close();
      return;
    }

    //inlisting the user to the online map and broadcasting it to every room the user is in
    online.set(user.id, socket);
    await broadcastOnline(user.id, online);

    console.log("online::", online.size);
    //websocket event handlers
    socket.on("message", (client_message) => {
      const parsed_message: WebsocketClientMessage = JSON.parse(
        client_message.toString()
      );
      switch (parsed_message.type) {
        case "send-friend-request": {
          const friend_request =
            parsed_message.payload as FriendRequestMessageType;

          sendfriendRequest(friend_request, online);
          break;
        }
        case "accept-friend-request": {
          const friend_request =
            parsed_message.payload as FriendRequestMessageType;

          acceptFriendrequest(friend_request, online);
          break;
        }
        case "send-direct-message":
          sendDirectMessage(parsed_message.payload as Message, online);
          break;
        case "delete-direct-message":
          deleteDirectMessage(parsed_message.payload as Message, online);
          break;
        case "join":
        default:
          return;
      }
    });
  });
}
