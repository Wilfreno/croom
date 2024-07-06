import { User } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../../server";
import { JSONResponse } from "../../lib/response-json";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router.delete("/", async (request, response) => {
  try {
    const { user_1_id, user_2_id }: Record<string, User["id"]> = request.body;

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user_1_id, user_2_id },
          { user_1_id: user_2_id, user_2_id: user_1_id },
        ],
      },
    });

    if (!friendship)
      return response
        .status(409)
        .json(
          JSONResponse(
            "CONFLICT",
            "cannot delete friendship; friendship does not exist"
          )
        );

    await prisma.friendship.delete({
      where: {
        id: friendship.id,
      },
    });

    return response
      .status(200)
      .json(JSONResponse("OK", "friendship deleted", null));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response
      .status(500)
      .json(
        JSONResponse("INTERNAL_SERVER_ERROR", "oops! something went wrong")
      );
  }
});

const v1_friend = router;

export default v1_friend;
