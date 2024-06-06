import { FriendRequest, RoomMessage, User } from "@prisma/client";
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

router.delete("/direct-message", async (request, response) => {
  try {
    const { message_id }: Record<string, string> = request.body;

    const found_message = await prisma.message.findFirst({
      where: {
        id: message_id,
      },
    });

    if (!found_message)
      return response
        .status(409)
        .json(serverConflict("cannot delete message; message does not exist"));

    await prisma.message.delete({
      where: {
        id: message_id,
      },
    });

    return response.status(200).json(okStatus("message deleted", null));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});
router.delete("/room-message/:id", async (request, response) => {
  try {
    const message: RoomMessage = request.body;

    const found_message = await prisma.roomMessage.findFirst({
      where: {
        id: message.id,
      },
    });

    if (!found_message)
      return response
        .status(409)
        .json(serverConflict("cannot delete message; message does not exist"));

    await prisma.roomMessage.delete({
      where: {
        id: message.id,
      },
    });

    return response.status(200).json(okStatus("message deleted", null));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});

const delete_router = router;

export default delete_router;
