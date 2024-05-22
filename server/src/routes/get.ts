import { Router } from "express";
import { badRequest, notFoundStatus, okStatus } from "../lib/response-json";
import { prisma } from "../server";
import { User } from "@prisma/client";
import exclude from "../lib/exclude";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router.get("/user/email/:email", async (request, response) => {
  try {
    const user_email = request.params.email;
    const user = await prisma.user.findUnique({ where: { email: user_email } });

    if (!user)
      return response.status(404).send(notFoundStatus("user not found"));

    return response
      .status(200)
      .send(okStatus("request succesful", exclude(user, ["password"])));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest(new Error(error as string)));
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
    return response.status(400).json(badRequest(new Error(error as string)));
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
            user_1: true,
            user_2: true,
          },
        },
      },
    });

    let friends = new Set<Omit<User, "password">>();

    for (let i = 0; i < user?.friends.length!; i++) {
      if (user?.friends[i].user_1.id !== id)
        friends.add(exclude(user!.friends[i].user_1!, ["password"]));
      if (user?.friends[i].user_2.id !== id)
        friends.add(exclude(user?.friends[i].user_2!, ["password"]));
    }
    return response
      .status(200)
      .json(okStatus("request succesful", Array.from(friends)));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest(new Error(error as string)));
  }
});
const get_router = router;

export default get_router;
