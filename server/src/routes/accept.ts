import { FriendRequest } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../server";
import { badRequest, okStatus, serverConflict } from "../lib/response-json";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router.post("/friend-request", async (request, response) => {
  try {
    const friend_request: FriendRequest = request.body;

    const found_request = await prisma.friendRequest.findFirst({
      where: {
        receiver_id: friend_request.receiver_id,
        sender_id: friend_request.sender_id,
      },
    });

    if (!found_request)
      response
        .status(409)
        .json(serverConflict("cannot add friend; request does not exist"));

    await prisma.friendship.create({
      data: {
        friend_1_id: friend_request.sender_id,
        friend_2_id: friend_request.receiver_id,
      },
    });

    await prisma.friendRequest.delete({
      where: {
        id: friend_request.id,
      },
    });
    return response.status(200).json(okStatus("friend request accepted", null));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest(new Error(error as string)));
  }
});

const accept_router = router;

export default accept_router;
