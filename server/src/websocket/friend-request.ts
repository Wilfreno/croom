import { User } from "@prisma/client";
import { prisma } from "../server";
import makeMessage from "./make-message";
import { NotificationType } from "src/lib/types/notification-type";
import { WebSocket } from "ws";

export default async function friendRequest(
  receiver: User["user_name"],
  online: Map<string, WebSocket>
) {
  const user_receiver = await prisma.user.findFirst({
    where: { user_name: receiver },
  });

  const found_request = await prisma.friendRequest.findFirst({
    where: {
      receiver_id: user_receiver?.id,
    },
    include: {
      sender: {
        include: {
          profile_pic: true,
        },
      },
    },
  });

  if (!online.has(user_receiver!.id)) return;

  online.get(user_receiver!.id)?.send(
    makeMessage("friend-request", {
      type: "friend-request",
      content: found_request,
      message: user_receiver!.display_name + " want to make friends with you.",
    } as NotificationType)
  );
}
