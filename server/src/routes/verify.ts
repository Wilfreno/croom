import { Router } from "express";
import {
  notFoundStatus,
  okStatus,
  serverError,
  unauthorized,
} from "../lib/response-json";
import { prisma } from "../server";
import { compare } from "bcrypt";
import exclude from "../lib/exclude";

const router = Router();

const environment_mode = process.env.NODE_ENV;

router.post("/user", async (request, response) => {
  try {
    const user = await request.body;
    const found_user = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!found_user)
      return response
        .status(404)
        .json(notFoundStatus("cannot find user; user does not exist"));

    if (!(await compare(user.password, found_user.password)))
      return response.status(401).json(unauthorized("password incorrect"));

    return response
      .status(200)
      .json(okStatus("user verified", exclude(found_user, ["password"])));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(500).json(serverError());
  }
});

const verify_router = router;

export default verify_router;
