import { Router } from "express";
import { prisma } from "../../server";
import { User } from "@prisma/client";
import exclude from "../../lib/exclude";
import { responseWithData, responseWithoutData } from "../../lib/response-json";

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
            responseWithoutData(
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
          .json(responseWithoutData("NOT_FOUND", "user cannot be found"));

      const found_friendship = await prisma.friendship.findFirst({
        where: {
          AND: [
            {
              OR: [
                { friend_1_id: found_sender.id },
                { friend_1_id: found_receiver.id },
              ],
            },
            {
              OR: [
                { friend_2_id: found_sender.id },
                { friend_2_id: found_receiver.id },
              ],
            },
          ],
        },
      });

      if (found_friendship)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              found_sender.display_name +
                " and " +
                found_receiver.display_name +
                " is already friends"
            )
          );

      const found_request = await prisma.friendRequest.findFirst({
        where: {
          sender_id: found_sender.id,
          receiver_id: found_receiver.id,
        },
      });

      if (found_request)
        return response
          .status(409)
          .json(
            responseWithoutData("CONFLICT", "already sent a friend request")
          );

      const friend_request = await prisma.friendRequest.create({
        data: {
          sender_id: found_sender.id,
          receiver_id: found_receiver.id,
        },
        include: {
          sender: {
            include: {
              profile_photo: true,
            },
          },
          receiver: {
            include: {
              profile_photo: true,
            },
          },
        },
      });

      return response.status(200).json(
        responseWithData("OK", "friend request sent", {
          sender: exclude(friend_request.sender, ["password"]),
          receiver: exclude(friend_request.receiver, ["password"]),
          date_created: friend_request.date_created,
        })
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
  .get("/sent/:id", async (request, response) => {
    try {
      const user_id = request.params.id;

      if (!user_id)
        return response
          .status(400)
          .json(
            responseWithoutData(
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
          .json(responseWithoutData("NOT_FOUND", "user not found"));

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
        .json(responseWithData("OK", "request successful", user_list));
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
  .get("/received/:id", async (request, response) => {
    try {
      const user_id = request.params.id;

      if (!user_id)
        return response
          .status(400)
          .json(
            responseWithoutData(
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
          .json(responseWithoutData("NOT_FOUND", "user not found"));

      const friend_request = await prisma.friendRequest.findMany({
        where: { receiver_id: user_id },
        select: {
          sender: {
            include: {
              profile_photo: true,
            },
          },
          date_created: true,
        },
      });

      let user_list = [];

      for (let i = 0; i < friend_request.length; i++) {
        user_list.push({
          sender: exclude(friend_request[i].sender, ["password"]),
          date_created: friend_request[i].date_created,
        });
      }

      return response
        .status(200)
        .json(responseWithData("OK", "request successful", user_list));
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

const v1_friend_request = router;

export default v1_friend_request;
