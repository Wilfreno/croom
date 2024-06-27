import { User } from "@prisma/client";
import { Router } from "express";
import exclude from "../../lib/exclude";
import { prisma } from "../../server";
import { responseWithData, responseWithoutData } from "../../lib/response-json";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router.delete("/", async (request, response) => {
  try {
    const { user_1_id, user_2_id }: Record<string, User["id"]> = request.body;

    const friendship_id = [user_1_id, user_2_id].sort().join("-");

    const friendship = await prisma.friendship.findFirst({
      where: { id: friendship_id },
    });

    if (!friendship)
      return response
        .status(409)
        .json(
          responseWithoutData(
            "CONFLICT",
            "cannot delete friendship; friendship does not exist"
          )
        );

    await prisma.friendship.delete({
      where: {
        id: friendship_id,
      },
    });

    return response
      .status(200)
      .json(responseWithData("OK", "friendship deleted", null));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response
      .status(500)
      .json(
        responseWithoutData(
          "INTERNAL_SERVER_ERROR",
          "oops! something went wrong"
        )
      );
  }
});

const v1_friend = router;

export default v1_friend;
