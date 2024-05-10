import { Photo, User } from "@prisma/client";
import { hash } from "bcrypt";
import { Router } from "express";
import exclude from "../lib/exclude";

import {
  notFoundStatus,
  okStatus,
  serverConflict,
  serverError,
} from "../lib/response-json";
import { prisma } from "../server";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router

  .route("/")

  .post(async (request, response) => {
    try {
      const user: User & { profile_pic: Photo } = await request.body;

      const found_user = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (found_user)
        return response.status(404).json(serverConflict("email already used"));

      const new_user = await prisma.user.create({
        data: {
          first_name: user.first_name,
          middle_name: user.middle_name ? user.middle_name : "",
          last_name: user.last_name,
          email: user.email,
          password: await hash(user.password, 14),
          profile_pic: {
            create: {
              photo_url: user.profile_pic.photo_url,
            },
          },
        },
        include: {
          profile_pic: true,
        },
      });

      return response
        .status(200)
        .json(okStatus("user created", exclude(new_user, ["password"])));
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response.status(500).json(serverError());
    }
  })

  .delete(async (request, response) => {
    try {
      const user: User = await request.body;

      const found_user = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!found_user)
        return response
          .status(409)
          .json(serverConflict("cannot delete user; user does not exist"));

      await prisma.user.delete({ where: { id: user.id } });

      return response.status(200).json(okStatus("user deleted", null));
    } catch (error) {
      if (environment_mode === "development") console.error(error);
    }
  })

  .patch(async (request, response) => {
    try {
      const user: User & { patch_type: string } = await request.body;

      const found_user = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!found_user)
        return response.status(404).json(notFoundStatus("user not found"));

      const new_user = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          ...user,
        },
      });

      return response
        .status(200)
        .json(okStatus("user updated", exclude(new_user, ["password"])));
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response.status(500).json(serverError());
    }
  });

router.get("/:id", async (request, response) => {
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

    return response.status(500).json(serverError());
  }
});
const user_router = router;

export default user_router;
