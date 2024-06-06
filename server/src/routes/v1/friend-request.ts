import { Router } from "express";
import { prisma } from "../../server";
import {
  badRequest,
  notFoundStatus,
  okStatus,
  serverConflict,
} from "../../lib/response-json";
import { User } from "@prisma/client";
import exclude from "../../lib/exclude";
import { FriendRequestMessageType } from "src/lib/types/websocket-types";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router
  .post("/", async (request, response) => {
    try {
      const { sender, receiver }: Record<string, User["user_name"]> =
        request.body;

      if (!sender || !receiver)
        return response
          .status(400)
          .json(
            serverConflict(
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
          .json(notFoundStatus("user cannot be found"));

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
            serverConflict(
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
          .json(serverConflict("already sent a friend request"));

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
        okStatus("friend request sent", {
          sender: exclude(friend_request.sender, ["password"]),
          receiver: exclude(friend_request.receiver, ["password"]),
          date_created: friend_request.date_created,
        })
      );
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response.status(400).json(badRequest());
    }
  })
  .get("/:id", async (request, response) => {
    try {
      const user_id = request.params.id;

      if (!user_id)
        return response
          .status(400)
          .json(badRequest("user id as params is needed; /friend-request/:id"));

      const friend_request = await prisma.friendRequest.findMany({
        where: {
          receiver_id: user_id,
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
        orderBy: {
          date_created: "asc",
        },
      });
      if (!friend_request)
        return response.status(404).json(notFoundStatus("user not found"));

      let user_list: FriendRequestMessageType[] = [];

      for (let i = 0; i < friend_request.length; i++) {
        user_list.push({
          sender: exclude(friend_request[i].sender, ["password"]),
          receiver: exclude(friend_request[i].receiver, ["password"]),
          date_created: friend_request[i].date_created,
        });
      }
      return response
        .status(200)
        .json(okStatus("request successfull", user_list));
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response.status(400).json(badRequest());
    }
  });

const v1_friend_request = router;

export default v1_friend_request;
