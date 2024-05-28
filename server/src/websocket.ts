import http, { request } from "http";
import WebSocket from "ws";
import {
  WebSocketSeverMessage,
  WebsocketClientMessage,
} from "./lib/types/websocket-types";
import { Room, User } from "@prisma/client";
import { prisma } from "./server";
import { parse } from "url";
import { NotificationType } from "./lib/types/notification-type";

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
    broadCastIfOnline(user.id);

    //websocket event handlers
    socket.on("message", (client_message) => {
      const parsed_message: WebsocketClientMessage = JSON.parse(
        client_message.toString()
      );
      switch (parsed_message.type) {
        case "join":
          joinRoom(socket, parsed_message.room_id!, parsed_message.sender!);
          break;
        case "message":
          broadcastMessage(
            socket,
            parsed_message.payload as string,
            parsed_message.room_id!
          );
          break;
        case "leave":
          leaveRoom(parsed_message.sender!, parsed_message.room_id!);
          break;
        case "kick":
          kicked(parsed_message.receiver!, parsed_message.room_id!);
          break;
        case "friend-request":
          friendRequest(parsed_message.sender!, parsed_message.receiver!);
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
      broadCastIfOffline(parsed_message.sender!);
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
  payload: WebSocketSeverMessage["payload"]
): string {
  return JSON.stringify({
    type,
    payload: payload,
  });
}

function broadCastIfOnline(user_id: User["id"]) {
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
function broadCastIfOffline(user_id: User["id"]) {
  rooms.forEach((room) => {
    if (room.has(user_id)) {
      room.forEach((member) => {
        if (member !== room.get(user_id)) {
          member.send(makeMessage("offline", user_id));
        }
      });
    }
  });
}
async function friendRequest(sender: User["id"], receiver: User["user_name"]) {
  const user_sender = await prisma.user.findFirst({
    where: { id: sender },
    include: { profile_pic: true },
  });
  const user_receiver = await prisma.user.findFirst({
    where: { user_name: receiver },
  });

  if (!user_sender || !user_receiver) return;
  if (!online.has(user_receiver.id)) return;

  online.get(user_receiver.id)?.send(
    makeMessage("friend-request", {
      type: "friend-request",
      content: {
        sender: user_sender,
        message: user_receiver.display_name + " want to make friends with you.",
      },
    })
  );
}

function kicked(user_id: User["id"], room_id: Room["id"]) {
  rooms
    .get(room_id)
    ?.get(user_id)
    ?.send(makeMessage("kicked", "you have been kicked out of the room"));
  leaveRoom(user_id, room_id);
}
