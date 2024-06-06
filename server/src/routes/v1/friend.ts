import { User } from "@prisma/client";
import { Router } from "express";
import exclude from "../../lib/exclude";
import {
  badRequest,
  notFoundStatus,
  okStatus,
  serverConflict,
} from "../../lib/response-json";
import { prisma } from "../../server";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router
  .get("/:id", async (request, response) => {
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
  })
  .delete("/", async (request, response) => {
    try {
      const { friend_1, friend_2 }: Record<string, User["id"]> = request.body;

      const friendship = await prisma.friendship.findFirst({
        where: {
          AND: [
            { OR: [{ friend_1_id: friend_1 }, { friend_1_id: friend_2 }] },
            { OR: [{ friend_2_id: friend_1 }, { friend_2_id: friend_2 }] },
          ],
        },
      });

      if (!friendship)
        return response
          .status(409)
          .json(
            serverConflict(
              "cannot delete friendship; friendship does not exist"
            )
          );

      await prisma.friendship.delete({
        where: {
          id: friendship.id,
        },
      });

      return response.status(200).json(okStatus("friendship deleted", null));
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response.status(400).json(badRequest());
    }
  });

const v1_friend = router;

export default v1_friend;
