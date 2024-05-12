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
