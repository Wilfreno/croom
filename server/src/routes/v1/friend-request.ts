import { Router } from "express";
import { prisma } from "../../server";
import { User } from "@prisma/client";
import exclude from "../../lib/exclude";
import { JSONResponse } from "../../lib/response-json";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router
  //create routes
  .post("/", async (request, response) => {
    try {
      const { sender, receiver }: Record<string, User["user_name"]> =
        request.body;

      if (!sender || !receiver)
        return response
          .status(400)
          .json(
            JSONResponse(
              "BAD_REQUEST",
              "sender and receiver on request body is required; {sender:username, receiver: username}"
            )
          );

      const found_sender = await prisma.user.findFirst({
        where: { user_name: sender },
      });
      const found_receiver = await prisma.user.findFirst({
        where: { user_name: receiver },
      });

      if (!found_sender || !found_receiver)
        return response
          .status(404)
          .json(JSONResponse("NOT_FOUND", "user cannot be found"));

      const friendship_id = [found_sender.id, found_sender.id].sort().join("-");

      const found_friendship = await prisma.friendship.findFirst({
        where: {
          id: friendship_id,
        },
      });

      if (found_friendship)
        return response
          .status(409)
          .json(
            JSONResponse(
              "CONFLICT",
              found_sender.display_name +
                " and " +
                found_receiver.display_name +
                " is already friends"
            )
          );

      const found_request = await prisma.friendRequest.findFirst({
        where: { id: friendship_id },
      });

      if (found_request)
        return response
          .status(409)
          .json(JSONResponse("CONFLICT", "already sent a friend request"));

      const friend_request = await prisma.friendRequest.create({
        data: {
          id: friendship_id,
          sender_id: found_sender.id,
          receiver_id: found_receiver.id,
        },
        include: {
          sender: {
            select: {
              id: true,
              user_name: true,
              display_name: true,
              profile_photo: true,
            },
          },
          receiver: {
            select: {
              id: true,
              user_name: true,
              display_name: true,
              profile_photo: true,
            },
          },
        },
      });

      return response
        .status(200)
        .json(JSONResponse("OK", "friend request sent", friend_request));
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response
        .status(500)
        .json(
          JSONResponse("INTERNAL_SERVER_ERROR", "oops! something went wrong")
        );
    }
  })
  .post("/accept", async (request, response) => {
    try {
      const { sender_id, receiver_id }: Record<string, string> = request.body;

      const found_request = await prisma.friendRequest.findFirst({
        where: { sender_id, receiver_id },
      });

      if (!found_request)
        response
          .status(409)
          .json(
            JSONResponse(
              "CONFLICT",
              "cannot add friend; request does not exist"
            )
          );

      await prisma.friendship.create({
        data: {
          id: found_request!.id,
          user_1_id: sender_id,
          user_2_id: receiver_id,
        },
      });

      await prisma.friendRequest.delete({
        where: {
          id: found_request!.id,
        },
      });

      return response
        .status(200)
        .json(JSONResponse("OK", "friend request accepted", null));
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response
        .status(400)
        .json(
          JSONResponse("INTERNAL_SERVER_ERROR", "oops! something went wrong")
        );
    }
  })

  //read routes
  .get("/sent/:id", async (request, response) => {
    try {
      const user_id = request.params.id;

      if (!user_id)
        return response
          .status(400)
          .json(
            JSONResponse(
              "BAD_REQUEST",
              "user id as params is needed; /friend-request/:id"
            )
          );

      const found_user = await prisma.user.findFirst({
        where: { id: user_id },
      });

      if (!found_user)
        return response
          .status(404)
          .json(JSONResponse("NOT_FOUND", "user not found"));

      const friend_request = await prisma.friendRequest.findMany({
        where: {
          sender_id: user_id,
        },
        select: {
          receiver: {
            include: {
              profile_photo: true,
            },
          },
          date_created: true,
        },
        orderBy: {
          date_created: "asc",
        },
      });

      let user_list = [];

      for (let i = 0; i < friend_request.length; i++) {
        user_list.push({
          receiver: exclude(friend_request[i].receiver, ["password"]),
          date_created: friend_request[i].date_created,
        });
      }
      return response
        .status(200)
        .json(JSONResponse("OK", "request successful", user_list));
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response
        .status(500)
        .json(
          JSONResponse("INTERNAL_SERVER_ERROR", "oops! something went wrong")
        );
    }
  })
  //update routes

  //delete routes
  .delete("/decline", async (request, response) => {
    try {
      const { sender_id, receiver_id }: Record<string, User["id"]> =
        request.body;

      const found_request = await prisma.friendRequest.findFirst({
        where: {
          sender_id,
          receiver_id,
        },
      });

      if (!found_request)
        return response
          .status(409)
          .json(
            JSONResponse(
              "CONFLICT",
              "cannot delete request; request does not exist"
            )
          );

      await prisma.friendRequest.delete({
        where: {
          id: found_request.id,
        },
      });

      return response
        .status(200)
        .json(JSONResponse("OK", "friend request declined", null));
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response
        .status(400)
        .json(
          JSONResponse("INTERNAL_SERVER_ERROR", "oops! something went wrong")
        );
    }
  });

const v1_friend_request = router;

export default v1_friend_request;
