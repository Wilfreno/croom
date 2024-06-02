import http from "http";
import WebSocket from "ws";
import { Room, User } from "@prisma/client";
import { parse } from "url";
import { prisma } from "src/server";
import { WebsocketClientMessage } from "src/lib/types/websocket-types";
import makeMessage from "./make-message";
import broadcastOnline from "./broadcast-online";
import joinRoom from "./join-room";
import sendMessage from "./send-message";
import leaveRoom from "./leave-room";
import kicked from "./kick";
import friendRequest from "./friend-request";
import broadCastOffline from "./broadcast-offline";

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
        case "join":
          joinRoom(
            socket,
            parsed_message.room_id!,
            parsed_message.sender!,
            rooms
          );
          break;
        case "message":
          sendMessage(
            socket,
            parsed_message.payload as string,
            parsed_message.room_id!,
            rooms
          );
          break;
        case "leave":
          leaveRoom(parsed_message.sender!, parsed_message.room_id!, rooms);
          break;
        case "kick":
          kicked(parsed_message.receiver!, parsed_message.room_id!, rooms);
          break;
        case "friend-request":
          friendRequest(parsed_message.receiver!, online);
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
