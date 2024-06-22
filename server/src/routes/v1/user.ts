import { ProfilePhoto, User } from "@prisma/client";
import { compare, hash } from "bcrypt";
import { Router } from "express";
import exclude from "../../lib/exclude";
import { prisma } from "../../server";
import { responseWithData, responseWithoutData } from "../../lib/response-json";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router
  //create routes
  .post("/", async (request, response) => {
    try {
      const user: User & { profile_photo: ProfilePhoto } = request.body;

      const found_user = await prisma.user.findFirst({
        where: { email: user.email },
      });
      if (found_user)
        return response
          .status(409)
          .json(responseWithoutData("CONFLICT", "email already used"));

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
        .json(
          responseWithData(
            "OK",
            "user created",
            exclude(new_user, ["password"])
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
  .post("/authenticate", async (request, response) => {
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

  //read routes
  .get("/email/:email", async (request, response) => {
    try {
      const user_email = request.params.email;
      const user = await prisma.user.findUnique({
        where: { email: user_email },
        include: { profile_photo: true },
      });

      if (!user)
        return response
          .status(404)
          .send(responseWithoutData("NOT_FOUND", "user not found"));

      return response
        .status(200)
        .send(
          responseWithData(
            "OK",
            "request successful",
            exclude(user, ["password"])
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
  .get("/:id", async (request, response) => {
    try {
      const user_id = request.params.id;

      const user = await prisma.user.findFirst({
        where: { id: user_id },
        include: { profile_photo: true },
      });

      if (!user)
        return response
          .status(404)
          .send(responseWithoutData("NOT_FOUND", "user not found"));

      return response
        .status(200)
        .send(
          responseWithData(
            "OK",
            "request successful",
            exclude(user, ["password"])
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
  .get("/room/:id", async (request, response) => {
    try {
      const user_id = request.params.id;

      const found_user = await prisma.user.findFirst({
        where: { id: user_id },
      });

      if (!found_user)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "cannot process request; user does not exist"
            )
          );

      const user = await prisma.user.findFirst({
        where: { id: user_id },
        select: {
          room_membership: {
            select: {
              room: {
                include: {
                  room_photo: true,
                },
              },
            },
          },
        },
      });

      return response.status(200).json(
        responseWithData(
          "OK",
          "request successful",
          user?.room_membership.map((room) => ({ ...room.room }))
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

  //update routes

  //delete routes
  .delete("/", async (request, response) => {
    try {
      const user: User = await request.body;

      const found_user = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!found_user)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "cannot delete user; user does not exist"
            )
          );

      await prisma.user.delete({ where: { id: user.id } });

      return response
        .status(200)
        .json(responseWithData("OK", "user deleted", null));
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

const v1_user = router;

export default v1_user;
