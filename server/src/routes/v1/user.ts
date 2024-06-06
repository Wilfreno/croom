import { ProfilePhoto, User } from "@prisma/client";
import { hash } from "bcrypt";
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
  .post("/", async (request, response) => {
    try {
      const user: User & { profile_photo: ProfilePhoto } = request.body;

      const found_user = await prisma.user.findFirst({
        where: { email: user.email },
      });
      if (found_user)
        return response.status(409).json(serverConflict("email already used"));

      const new_user = await prisma.user.create({
        data: {
          display_name: user.display_name,
          user_name: user.user_name,
          email: user.email,
          birth_date: user.birth_date ? user.birth_date : null,
          profile_photo: {
            create: {
              photo_url: user.profile_photo.photo_url
                ? user.profile_photo.photo_url
                : "",
            },
          },
          password: user.password ? await hash(user.password, 14) : null,
        },
        include: {
          profile_photo: true,
        },
      });

      return response
        .status(200)
        .json(okStatus("user created", exclude(new_user, ["password"])));
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response.status(400).json(badRequest());
    }
  })
  .get("/email/:email", async (request, response) => {
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
  })
  .get("/:id", async (request, response) => {
    try {
      const user_id = request.params.id;

      const user = await prisma.user.findFirst({
        where: { id: user_id },
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
  })
  .delete("/", async (request, response) => {
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
      return response.status(400).json(badRequest());
    }
  });

const v1_user = router;

export default v1_user;
