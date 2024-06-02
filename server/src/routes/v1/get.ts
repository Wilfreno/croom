import { Router } from "express";
import { badRequest, notFoundStatus, okStatus } from "../../lib/response-json";
import { prisma } from "../../server";
import { User } from "@prisma/client";
import exclude from "../../lib/exclude";
import { parse } from "url";

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

    const friendship = await prisma.friendship.findMany({
      where: {
        OR: [{ friend_1_id: id }, { friend_2_id: id }],
      },
      include: {
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
    });
    if (!friendship)
      return response.status(404).json(notFoundStatus("user got no friends"));

    let friends = new Set<Omit<User, "password">>();

    for (let i = 0; i < friendship.length; i++) {
      if (friendship[i].user_1.id !== id)
        friends.add(exclude(friendship[i].user_1!, ["password"]));
      if (friendship[i].user_2.id !== id)
        friends.add(exclude(friendship[i].user_2!, ["password"]));
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

router.get("/dm/:receiver", async (request, response) => {
  try {
    const receiver = request.params.receiver;
    const sender = parse(request.url, true).query;
    const fdff = request.query;
    console.log(fdff);

    return response.status(200);
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});
const get_router = router;

export default get_router;
