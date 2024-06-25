/**
 * @author Wilfreno Gayongan
 *
 *
 *  this section is the implementation of the websocket server
 */

import http from "http";
import WebSocket from "ws";
import { Lounge, RoomMember, Session, User } from "@prisma/client";
import { parse } from "url";
import { prisma } from "../server";
import {
  WebsocketFriendRequestType,
  WebsocketUserType,
  WebsocketLoungeMessageType,
  WebsocketDirectMessageType,
  WebsocketRoomSessionType,
  WebsocketSessionMessageType,
  WebSocketMessage,
  WebsocketRoomMemberType,
} from "src/lib/types/websocket-types";
import createMessage from "./make-message";
import broadcastOnline from "./broadcast-online";
import sendDirectMessage from "./send-direct-message";
import deleteDirectMessage from "./delete-direct-message";
import sendFriendRequest from "./send-friend-request";
import acceptFriendRequest from "./accept-friend-request";
import newRoomMember from "./new-room-member";
import joinLounge from "./join-lounge";
import leaveLounge from "./leave-lounge";
import sendLoungeMessage from "./send-lounge-message";
import joinSession from "./join-session";
import leaveSession from "./leave-session";
import sendSessionMessage from "./send-session-message";
import broadcastOffline from "./broadcast-offline";

const lounge = new Map<
  Lounge["id"],
  Map<User["id"], WebsocketRoomMemberType>
>();

const session = new Map<Session["id"], Map<User["id"], WebsocketUserType>>();
const online = new Map<User["id"], WebsocketUserType>();

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
    //checking if there is  user_id query parameter on teh url
    if (!params.user_id) {
      socket.send(
        createMessage(
          "error",
          "the url connection needs a user_id query parameter"
        )
      );
      socket.close();
      return;
    }
    const user = await prisma.user.findFirst({
      where: { id: params.user_id! as string },
      include: {
        profile_photo: {
          select: {
            photo_url: true,
          },
        },
      },
    });

    //closing connection if user does not exist
    if (!user) {
      socket.send(createMessage("error", "user does not exist"));
      socket.close();
      return;
    }

    //enlisting the user to the online map and broadcasting it to every room the user is in
    online.set(user.id, {
      user: {
        id: user.id,
        display_name: user.display_name,
        user_name: user.user_name,
        profile_photo: {
          photo_url: user.profile_photo?.photo_url!,
        },
      },
      websocket: socket,
    });

    await broadcastOnline(user.id, online, lounge);

    //websocket event handlers
    socket.on("message", (client_message) => {
      const parsed_message: WebSocketMessage = JSON.parse(
        client_message.toString()
      );
      switch (parsed_message.type) {
        case "send-friend-request": {
          const friend_request =
            parsed_message.payload as WebsocketFriendRequestType;
          sendFriendRequest(friend_request, online);
          break;
        }
        case "accept-friend-request": {
          const friend_request =
            parsed_message.payload as WebsocketFriendRequestType;

          acceptFriendRequest(friend_request, online);
          break;
        }
        case "send-direct-message":
          sendDirectMessage(
            parsed_message.payload as WebsocketDirectMessageType,
            online
          );
          break;
        case "delete-direct-message":
          deleteDirectMessage(
            parsed_message.payload as WebsocketDirectMessageType,
            online
          );
          break;
        case "new-room-member": {
          const payload = parsed_message.payload as RoomMember;
          newRoomMember(lounge, online, payload);
          break;
        }
        case "join-lounge": {
          const payload = parsed_message.payload as RoomMember;
          joinLounge(lounge, online, payload);
          break;
        }
        case "leave-lounge": {
          const payload = parsed_message.payload as RoomMember;
          leaveLounge(lounge, payload);
          break;
        }
        case "send-lounge-message": {
          const payload = parsed_message.payload as WebsocketLoungeMessageType;
          sendLoungeMessage(lounge, payload);
          break;
        }
        case "join-session": {
          const payload = parsed_message.payload as WebsocketRoomSessionType;
          joinSession(session, online, payload);
          break;
        }
        case "leave-session": {
          const payload = parsed_message.payload as WebsocketRoomSessionType;
          leaveSession(session, payload);
          break;
        }
        case "send-session-message": {
          const payload = parsed_message.payload as WebsocketSessionMessageType;
          sendSessionMessage(session, payload);
        }
        default:
          return;
      }
    });
    socket.on("close", () => broadcastOffline(user.id, online, lounge));
  });
}
