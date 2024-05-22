import http, { request } from "http";
import WebSocket from "ws";
import {
  WebSocketSeverMessage,
  WebsocketClientMessage,
} from "./lib/types/websocket-types";
import { Room, User } from "@prisma/client";
import { prisma } from "./server";
import { parse } from "url";

const members = new Map<User["id"], WebSocket>();
const rooms = new Map<Room["id"], typeof members>();

export default function WebsocketServer(
  http_server: http.Server<
    typeof http.IncomingMessage,
    typeof http.ServerResponse
  >
) {
  const websocket_server = new WebSocket.Server({ noServer: true });

  http_server.on("upgrade", async (request, socket, head) => {
    try {
      const user_id = request.headers["user-id"];

      console.log("user_id", request.headers["user-id"]);
      const found_user = await prisma.user.findFirst({
        where: { id: user_id as string },
      });

      if (!found_user) {
        socket.write("HTTP/1.1 404 NotFound\r\n\r\n ");
        socket.destroy();
        return;
      }
      websocket_server.handleUpgrade(request, socket, head, (ws) => {
        websocket_server.emit("connection", ws, request);
      });
    } catch (error) {
      console.log(error);
      socket.write("HTTP/1.1 400 BadRequest\r\n\r\n ");
      socket.destroy();
      return;
    }
  });

  websocket_server.on("connection", (socket, request) => {

    socket.on("message", (client_message) => {
      const parsed_message: WebsocketClientMessage = JSON.parse(
        client_message.toString()
      );
      switch (parsed_message.type) {
        case "join":
          joinRoom(socket, parsed_message.room_id, parsed_message.user_id);
          break;
        case "message":
          broadcastMessage(
            socket,
            parsed_message.payload,
            parsed_message.room_id
          );
          break;
        case "leave":
          leaveRoom(parsed_message.user_id, parsed_message.room_id);
          break;
        case "kick":
          kicked(parsed_message.user_id, parsed_message.room_id);
          break;
      }
    });
  });
}

async function joinRoom(
  socket: WebSocket,
  room_id: Room["id"],
  user_id: User["id"]
) {
  // making new room if room does'nt exist
  if (!rooms.get(room_id)) {
    rooms.set(room_id, new Map());
  }

  //checking if user already in the list and update the database
  if (!rooms.get(room_id)?.get(user_id)) {
    await prisma.room.update({
      where: { id: room_id },
      data: {
        members: {
          connect: {
            id: user_id,
          },
        },
      },
      include: {
        members: true,
      },
    });
  }
  //updating the user connection
  rooms.get(room_id)?.set(user_id, socket);

  socket.send(makeMessage("success", "You joined the room; send a message!"));
}

async function leaveRoom(user_id: User["id"], room_id: Room["id"]) {
  rooms.get(room_id)?.delete(user_id);
  await prisma.room.update({
    where: { id: room_id },
    data: {
      members: {
        disconnect: {
          id: user_id,
        },
      },
    },
    include: {
      members: true,
    },
  });
}

function broadcastMessage(
  sender: WebSocket,
  room_id: Room["id"],
  message: string
) {
  rooms.get(room_id)?.forEach((member) => {
    if (member !== sender && member.readyState === WebSocket.OPEN) {
      member.send(makeMessage("message", message));
    }
  });
}

function makeMessage(
  type: WebSocketSeverMessage["type"],
  message: string
): string {
  return JSON.stringify({
    payload: message,
    type,
  });
}

function BroadCastIfOnline(user_id: User["id"]) {
  rooms.forEach((room) => {
    if (room.has(user_id)) {
      room.forEach((member) => {
        if (member !== room.get(user_id)) {
          member.send(makeMessage("online", user_id));
        }
      });
    }
  });
}

function kicked(user_id: User["id"], room_id: Room["id"]) {
  rooms
    .get(room_id)
    ?.get(user_id)
    ?.send(makeMessage("kicked", "you have been kicked out of the room"));
  leaveRoom(user_id, room_id);
}
