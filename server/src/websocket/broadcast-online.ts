import { Lounge, User } from "@prisma/client";
import { prisma } from "../server";
import createMessage from "./make-message";
import { WebsocketUserType } from "src/lib/types/websocket-types";

export default async function broadcastOnline(
  user_id: User["id"],
  online: Map<string, WebsocketUserType>,
  lounge: Map<Lounge["id"], Map<User["id"], WebsocketUserType>>
) {
  const room_member_list = await prisma.roomMember.findMany({
    where: {
      id: user_id,
    },
    select: {
      room_id: true,
    },
  });

  const friendship = await prisma.friendship.findMany({
    where: {
      OR: [{ friend_1_id: user_id }, { friend_2_id: user_id }],
    },
    select: {
      friend_1_id: true,
      friend_2_id: true,
    },
  });

  let friends = new Set<User["id"]>();
  const current_user = online.get(user_id);
  for (let i = 0; i < friendship.length!; i++) {
    if (friendship[i].friend_1_id !== user_id)
      friends.add(friendship[i].friend_1_id);
    if (friendship[i].friend_2_id !== user_id)
      friends.add(friendship[i].friend_2_id);
  }

  for (const friend_id of friends) {
    const friend = online.get(friend_id);

    if (friend) {
      friend.websocket!.send(
        createMessage("online-friend", { user: current_user!.user })
      );
      current_user!.websocket!.send(
        createMessage("online-friend", { user: friend.user })
      );
    }
  }

  for (const room_member of room_member_list) {
    lounge.get(room_member.room_id)?.forEach((member) => {
      if (member.user.id !== current_user?.user.id) {
        member.websocket?.send(
          createMessage("online-room-member", { user: current_user?.user! })
        );
        current_user?.websocket?.send(
          createMessage("online-room-member", { user: member.user })
        );
      }
    });
  }
}
