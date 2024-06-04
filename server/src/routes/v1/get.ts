import { Router } from "express";
import { badRequest, notFoundStatus, okStatus } from "../../lib/response-json";
import { prisma } from "../../server";
import { User } from "@prisma/client";
import exclude from "../../lib/exclude";
import { parse } from "url";
import { FriendRequestMessageType } from "src/lib/types/websocket-types";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router.get("/user/email/:email", async (request, response) => {
  try {
    const user_email = request.params.email;
    const user = await prisma.user.findUnique({
      where: { email: user_email },
      include: { profile_photo: true },
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
        friend_1: {
          include: {
            profile_photo: true,
          },
        },
        friend_2: {
          include: {
            profile_photo: true,
          },
        },
      },
    });
    if (!friendship)
      return response.status(404).json(notFoundStatus("user got no friends"));

    let friends = new Set<Omit<User, "password">>();

    for (let i = 0; i < friendship.length; i++) {
      if (friendship[i].friend_1.id !== id)
        friends.add(exclude(friendship[i].friend_1!, ["password"]));
      if (friendship[i].friend_2.id !== id)
        friends.add(exclude(friendship[i].friend_2!, ["password"]));
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

    const friend_request = await prisma.friendRequest.findMany({
      where: {
        receiver_id: user_id,
      },
      include: {
        sender: {
          include: {
            profile_photo: true,
          },
        },
        receiver: {
          include: {
            profile_photo: true,
          },
        },
      },
      orderBy: {
        date_created: "asc",
      },
    });
    if (!friend_request)
      return response.status(404).json(notFoundStatus("user not found"));

    let user_list: FriendRequestMessageType[] = [];

    for (let i = 0; i < friend_request.length; i++) {
      user_list.push({
        sender: exclude(friend_request[i].sender, ["password"]),
        receiver: exclude(friend_request[i].receiver, ["password"]),
        date_created: friend_request[i].date_created,
      });
    }
    return response
      .status(200)
      .json(okStatus("request successfull", user_list));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});
router.get("/dm/:friend_id", async (request, response) => {
  try {
    const friend_id = request.params.friend_id;
    const query = request.query;

    if (!query.user_id)
      return response
        .status(400)
        .json(
          badRequest(
            "user id is required as a query parameter; /dm/:friend_id?user_id= "
          )
        );

    const user = query.user_id as string;
    let count = 20;
    let skip = 0;
    if (query.page) {
      count *= Number(query.page);
      skip = count - 20;
    }

    const direct_messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          {
            AND: [{ sender_id: user }, { receiver_id: friend_id }],
          },
          {
            AND: [{ sender_id: friend_id }, { receiver_id: user }],
          },
        ],
      },
      include: {
        text_message: true,
        photo_message: true,
        video_message: true,
      },
      orderBy: {
        date_created: "desc",
      },
      take: count,
      skip,
    });
    return response
      .status(200)
      .json(okStatus("request succesfull", direct_messages));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});
const get_router = router;

export default get_router;
