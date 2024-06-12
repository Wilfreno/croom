import { Router } from "express";
import { prisma } from "../server";
import { responseWithData, responseWithoutData } from "../lib/response-json";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router.post("/friend-request", async (request, response) => {
  try {
    const { sender, receiver }: Record<string, string> = request.body;

    const found_request = await prisma.friendRequest.findFirst({
      where: {
        receiver_id: receiver,
        sender_id: sender,
      },
    });

    if (!found_request)
      response
        .status(409)
        .json(
          responseWithoutData(
            "CONFLICT",
            "cannot add friend; request does not exist"
          )
        );

    await prisma.friendship.create({
      data: {
        friend_1_id: sender,
        friend_2_id: receiver,
      },
    });

    await prisma.friendRequest.delete({
      where: {
        sender_id_receiver_id: {
          sender_id: sender,
          receiver_id: receiver,
        },
      },
    });
    return response
      .status(200)
      .json(responseWithData("OK", "friend request accepted", null));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response
      .status(400)
      .json(
        responseWithoutData(
          "INTERNAL_SERVER_ERROR",
          "oops! something went wrong"
        )
      );
  }
});

const accept_router = router;

export default accept_router;
