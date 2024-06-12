import { Router } from "express";
import { responseWithData, responseWithoutData } from "../lib/response-json";
import { prisma } from "../server";
import { User } from "@prisma/client";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router.delete("/friend-request", async (request, response) => {
  try {
    const { sender, receiver }: Record<string, User["id"]> = request.body;

    const found_request = await prisma.friendRequest.findFirst({
      where: {
        sender_id: sender,
        receiver_id: receiver,
      },
    });

    if (!found_request)
      return response
        .status(409)
        .json(
          responseWithoutData(
            "CONFLICT",
            "cannot delete request; request does not exist"
          )
        );

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
      .json(responseWithData("OK", "friend request declined", null));
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

const decline_router = router;

export default decline_router;
