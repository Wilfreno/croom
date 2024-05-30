import { Router } from "express";
import { badRequest, notFoundStatus, okStatus } from "../lib/response-json";
import { prisma } from "../server";
import { FriendRequest, User } from "@prisma/client";
import exclude from "../lib/exclude";
import { NotificationType } from "../lib/types/notification-type";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router.get("/user/email/:email", async (request, response) => {
  try {
    const user_email = request.params.email;
    const user = await prisma.user.findUnique({
      where: { email: user_email },
      include: { profile_pic: true },
    });

    if (!user)
      return response.status(404).send(notFoundStatus("user not found"));

    return response
      .status(200)
      .send(okStatus("request succesful", exclude(user, ["password"])));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});
router.get("/user/:id", async (request, response) => {
  try {
    const user_id = request.params.id;

    const user = await prisma.user.findFirst({ where: { id: user_id } });

    if (!user)
      return response.status(404).send(notFoundStatus("user not found"));

    return response
      .status(200)
      .send(okStatus("request succesful", exclude(user, ["password"])));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});
router.get("/friends/:id", async (request, response) => {
  try {
    const id = request.params.id;

    const user = await prisma.user.findFirst({
      where: { id },
      select: {
        friends: {
          select: {
            user_1: {
              include: {
                profile_pic: true,
              },
            },
            user_2: {
              include: {
                profile_pic: true,
              },
            },
          },
        },
        friends_with: {
          select: {
            user_1: {
              include: {
                profile_pic: true,
              },
            },
            user_2: {
              include: {
                profile_pic: true,
              },
            },
          },
        },
      },
    });

    if (!user)
      return response.status(404).json(notFoundStatus("user not found"));

    let friends = new Set<Omit<User, "password">>();

    for (let i = 0; i < user?.friends.length!; i++) {
      if (user?.friends[i].user_1.id !== id)
        friends.add(exclude(user!.friends[i].user_1!, ["password"]));
      if (user?.friends[i].user_2.id !== id)
        friends.add(exclude(user?.friends[i].user_2!, ["password"]));
    }
    for (let i = 0; i < user?.friends_with.length!; i++) {
      if (user?.friends_with[i].user_1.id !== id)
        friends.add(exclude(user!.friends_with[i].user_1!, ["password"]));
      if (user?.friends_with[i].user_2.id !== id)
        friends.add(exclude(user?.friends_with[i].user_2!, ["password"]));
    }

    return response
      .status(200)
      .json(okStatus("request succesful", Array.from(friends)));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});

router.get("/friend-request/:id", async (request, response) => {
  try {
    const user_id = request.params.id;

    if (!user_id)
      return response
        .status(400)
        .json(badRequest("user id as params is needed; /friend-request/:id"));

    const user = await prisma.friendRequest.findMany({
      where: {
        receiver_id: user_id,
      },
      select: {
        sender: {
          include: {
            profile_pic: true,
          },
        },
      },
      orderBy: {
        date_created: "asc",
      },
    });
    if (!user)
      return response.status(404).json(notFoundStatus("user not found"));

    let user_list: { sender: Omit<User, "password"> }[] = [];

    for (let i = 0; i < user.length; i++) {
      user_list.push({ sender: exclude(user[i].sender, ["password"]) });
    }
    return response
      .status(200)
      .json(okStatus("request successfull", user_list));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});

const get_router = router;

export default get_router;
