import { prisma } from "../server";
import createMessage from "./make-message";
import {
  WebsocketFriendRequestType,
  WebsocketUserType,
} from "../lib/types/websocket-types";
import { Notification } from "@prisma/client";

export default async function sendFriendRequest(
  payload: WebsocketFriendRequestType,
  online: Map<string, WebsocketUserType>
) {
  if (!online.has(payload.receiver_id)) return;

  const notification = await prisma.notification.findFirst({
    where: {
      type: "FRIEND_REQUEST",
      friend_request: {
        sender_id: payload.sender_id,
        receiver_id: payload.receiver_id,
      },
    },
    include: {
      friend_request: {
        include: {
          sender: {
            select: {
              id: true,
              user_name: true,
              display_name: true,
              profile_photo: true,
            },
          },
        },
      },
    },
  });

  online
    .get(payload.receiver_id)
    ?.websocket!.send(
      createMessage("notification", notification as Notification)
    );
}
