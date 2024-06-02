import { User } from "@prisma/client";
import { prisma } from "../server";
import exclude from "../lib/exclude";
import makeMessage from "./make-message";
import { type WebSocket } from "ws";

export default async function broadcastOnline(
  user_id: User["id"],
  online: Map<string, WebSocket>,
  rooms: Map<string, Map<string, WebSocket>>
) {
  const user = await prisma.user.findFirst({
    where: {
      id: user_id,
    },
    include: {
      profile_photo: true,
    },
  });

  const friendship = await prisma.friendship.findMany({
    where: {
      OR: [{ friend_1_id: user_id }, { friend_2_id: user_id }],
    },
    include: {
      friend_1: {
        include: {
          profile_photo: true,
        },
      },
      friend_2: {
        include: {
          profile_photo: true,
        },
      },
    },
  });

  let friends = new Set<Omit<User, "password">>();

  for (let i = 0; i < friendship.length!; i++) {
    if (friendship[i].friend_1.id !== user_id)
      friends.add(exclude(friendship[i].friend_1, ["password"]));
    if (friendship[i].friend_2.id !== user_id)
      friends.add(exclude(friendship[i].friend_2!, ["password"]));
  }

  for (let friend of friends) {
    online
      .get(friend.id)
      ?.send(makeMessage("online", exclude(user as User, ["password"])));

    online.get(user_id)?.send(makeMessage("online", friend));
  }

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
