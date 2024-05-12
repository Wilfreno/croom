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

router.post("/otp", async (request, response) => {
  try {
    const { otp, email } = await request.body;

    const found_otp = await prisma.otp.findMany({
      where: {
        email,
      },
    });

    if (!found_otp)
      return response.status(404).json(notFoundStatus("OTP does not exist"));

    if (!found_otp.find((f_otp) => f_otp.value === otp))
      return response.status(401).json(unauthorized("OTP incorrect"));

    await prisma.otp.deleteMany({ where: { email } });
    return response.status(200).json(okStatus("OTP verified", null));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(500).json(serverError());
  }
});
const authenticate_router = router;

export default authenticate_router;
