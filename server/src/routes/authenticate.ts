import { Router } from "express";
import { prisma } from "../server";
import { compare } from "bcrypt";
import exclude from "../lib/exclude";
import { responseWithData, responseWithoutData } from "../lib/response-json";

const router = Router();

const environment_mode = process.env.NODE_ENV;

router
  .post("/user", async (request, response) => {
    try {
      const { email, password } = await request.body;
      const found_user = await prisma.user.findFirst({
        where: { email: { contains: email } },
      });

      if (!found_user)
        return response
          .status(404)
          .json(responseWithoutData("NOT_FOUND", "user does not exist"));

      if (!(await compare(password, found_user.password!)))
        return response
          .status(401)
          .json(responseWithoutData("UNAUTHORIZED", "password incorrect"));

      return response
        .status(200)
        .json(
          responseWithData(
            "OK",
            "user verified",
            exclude(found_user, ["password"])
          )
        );
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response
        .status(500)
        .json(
          responseWithoutData(
            "INTERNAL_SERVER_ERROR",
            "oops! something went wrong"
          )
        );
    }
  })
  .post("/otp", async (request, response) => {
    try {
      const { otp, email }: { otp: string; email: string } = await request.body;

      const found_otp = await prisma.otp.findMany({
        where: {
          email,
        },
      });

      if (!found_otp)
        return response
          .status(404)
          .json(responseWithoutData("NOT_FOUND", "OTP does not exist"));

      if (!found_otp.find((f_otp) => f_otp.value === otp))
        return response
          .status(401)
          .json(responseWithoutData("UNAUTHORIZED", "OTP incorrect"));

      await prisma.otp.deleteMany({ where: { email } });
      return response
        .status(200)
        .json(responseWithData("OK", "OTP verified", null));
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response
        .status(500)
        .json(
          responseWithoutData(
            "INTERNAL_SERVER_ERROR",
            "oops! something went wrong"
          )
        );
    }
  });

const authenticate_router = router;

export default authenticate_router;
