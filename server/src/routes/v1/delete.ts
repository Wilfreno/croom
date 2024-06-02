import { FriendRequest, Room, User } from "@prisma/client";
import { Router, response } from "express";
import { badRequest, okStatus, serverConflict } from "../../lib/response-json";
import { prisma } from "../../server";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router.delete("/user", async (request, response) => {
  try {
    const user: User = await request.body;

    const found_user = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!found_user)
      return response
        .status(409)
        .json(serverConflict("cannot delete user; user does not exist"));

    await prisma.user.delete({ where: { id: user.id } });

    return response.status(200).json(okStatus("user deleted", null));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});

router.delete("/room", async (request, response) => {
  try {
    const room: Room = await request.body;

    const found_room = await prisma.room.findFirst({ where: { id: room.id } });

    if (!found_room)
      return response
        .status(409)
        .json(serverConflict("cannot delete room; room does not exist"));

    await prisma.room.delete({ where: { id: room.id } });

    return response.status(200).json(okStatus("room has been deleted", null));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});

router.delete("/friend", async (request, response) => {
  try {
    const { friend_1, friend_2 }: Record<string, User["id"]> = request.body;

    const friendship = await prisma.friendship.findFirst({
      where: {
        AND: [
          { OR: [{ friend_1_id: friend_1 }, { friend_1_id: friend_2 }] },
          { OR: [{ friend_2_id: friend_1 }, { friend_2_id: friend_2 }] },
        ],
      },
    });

    if (!friendship)
      return response
        .status(409)
        .json(
          serverConflict("cannot delete friendship; friendship does not exist")
        );

    await prisma.friendship.delete({
      where: {
        id: friendship.id,
      },
    });

    return response.status(200).json(okStatus("friendship deleted", null));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});

const delete_router = router;

export default delete_router;
