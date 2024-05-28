import { FriendRequest, Room, User } from "@prisma/client";
import { Router, response } from "express";
import {
  badRequest,
  okStatus,
  serverConflict,
  serverError,
} from "../lib/response-json";
import { prisma } from "../server";

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
    return response.status(400).json(badRequest(new Error(error as string)));
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
    return response.status(400).json(badRequest(new Error(error as string)));
  }
});

router.delete("/message", async (request, response) => {
  try {
    const message = await request.body;

    const found_mesasge = await prisma.message.findFirst({
      where: { id: message.id },
    });

    if (!found_mesasge)
      return response
        .status(409)
        .json(serverConflict("cannot delete message; message does not exist"));

    await prisma.message.findFirst({ where: { id: message.id } });

    return response.status(200).json(okStatus("messsage deleted", null));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest(new Error(error as string)));
  }
});


const delete_router = router;

export default delete_router;
