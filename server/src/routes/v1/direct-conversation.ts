import { Router } from "express";
import { badRequest, notFoundStatus, okStatus } from "../../lib/response-json";
import { prisma } from "../../server";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router.get("/:id", async (request, response) => {
  try {
    const user_id = request.params.id;

    const found_user = await prisma.user.findFirst({ where: { id: user_id } });

    if (!found_user)
      return response.status(404).json(notFoundStatus("user does not exist"));

    const direct_conversation = await prisma.directConversation.findMany({
      where: {
        OR: [{ user1_id: user_id }, { user2_id: user_id }],
      },
      include: {
        user1: {
          select: {
            id: true,
            display_name: true,
            profile_photo: true,
          },
        },
        user2: {
          select: {
            id: true,
            display_name: true,
            profile_photo: true,
          },
        },
        messages: {
          include: {
            text_message: true,
            photo_message: true,
            video_message: true,
          },
          orderBy: {
            date_created: "desc",
          },
          take: 1,
        },
      },
    });

    return response
      .status(200)
      .json(okStatus("request successful", direct_conversation));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});

const v1_direct_conversation = router;

export default v1_direct_conversation;
