import http from "http";
import WebSocket from "ws";
import { Room, User } from "@prisma/client";
import { parse } from "url";
import { prisma } from "../server";
import {
  DirectMessageType,
  FriendRequestMessageType,
  WebsocketClientMessage,
} from "src/lib/types/websocket-types";
import makeMessage from "./make-message";
import broadcastOnline from "./broadcast-online";
import joinRoom from "./join-room";
import sendMessage from "./send-direct-message";
import leaveRoom from "./leave-room";
import kicked from "./kick";
import friendRequest from "./send-friend-request";
import broadCastOffline from "./broadcast-offline";
import sendDirectMessage from "./send-direct-message";
import deleteDirectMessage from "./delete-direct-message";
import sendfriendRequest from "./send-friend-request";
import acceptFriendrequest from "./accept-friend-request";

const members = new Map<User["id"], WebSocket>();
const rooms = new Map<Room["id"], typeof members>();
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
    await broadcastOnline(user.id, online, rooms);

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
          sendDirectMessage(
            parsed_message.receiver!,
            parsed_message.payload as DirectMessageType,
            online
          );
          break;
        case "delete-direct-message":
          deleteDirectMessage(parsed_message.receiver!, online);
          break;
        case "join":
          joinRoom(
            socket,
            parsed_message.room_id!,
            parsed_message.sender!,
            rooms
          );
          break;
        case "leave":
          leaveRoom(parsed_message.sender!, parsed_message.room_id!, rooms);
          break;
        case "kick":
          kicked(parsed_message.receiver!, parsed_message.room_id!, rooms);
          break;
        default:
          return;
      }
    });

    socket.on("close", (client_message) => {
      const parsed_message: WebsocketClientMessage = JSON.parse(
        client_message.toString()
      );

      online.delete(parsed_message.sender!);
      broadCastOffline(parsed_message.sender!, rooms);
    });
  });
}
