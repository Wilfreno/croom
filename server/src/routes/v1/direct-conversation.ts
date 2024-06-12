import { Router } from "express";
import { prisma } from "../../server";
import { DirectConversation, DirectMessage } from "@prisma/client";
import { responseWithData, responseWithoutData } from "../../lib/response-json";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router
  //create routes
  .post("/message/text", async (request, response) => {
    try {
      const { sender_id, receiver_id, text }: Record<string, string> =
        request.body;

      const dm_id = [sender_id, receiver_id].sort().join("-");

      const found_conversation = await prisma.directConversation.findFirst({
        where: { id: dm_id },
      });

      let conversation: DirectConversation & { messages: DirectMessage[] };

      if (found_conversation) {
        conversation = await prisma.directConversation.update({
          where: {
            id: found_conversation.id,
          },
          data: {
            messages: {
              create: {
                type: "TEXT",
                receiver_id,
                sender_id,
                text_message: {
                  create: { content: text },
                },
              },
            },
          },
          include: {
            messages: {
              include: { text_message: true },
              orderBy: {
                date_created: "desc",
              },
              take: 1,
            },
          },
        });
      } else {
        conversation = await prisma.directConversation.create({
          data: {
            id: dm_id,
            user1_id: sender_id,
            user2_id: receiver_id,
            messages: {
              create: {
                sender_id,
                receiver_id,
                type: "TEXT",
                text_message: {
                  create: {
                    content: text,
                  },
                },
              },
            },
          },
          include: {
            messages: {
              include: { text_message: true },
              orderBy: {
                date_created: "desc",
              },
              take: 1,
            },
          },
        });
      }

      return response
        .status(200)
        .json(responseWithData("OK", "message sent", conversation.messages[0]));
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
  .get("/:id", async (request, response) => {
    try {
      const user_id = request.params.id;

      const found_user = await prisma.user.findFirst({
        where: { id: user_id },
      });

      if (!found_user)
        return response
          .status(404)
          .json(responseWithoutData("NOT_FOUND", "user does not exist"));

      const direct_conversation = await prisma.directConversation.findMany({
        where: {
          OR: [{ user1_id: user_id }, { user2_id: user_id }],
        },
        include: {
          user1: {
            select: {
              id: true,
              display_name: true,
              profile_photo: true,
            },
          },
          user2: {
            select: {
              id: true,
              display_name: true,
              profile_photo: true,
            },
          },
          messages: {
            include: {
              text_message: true,
              photo_message: true,
              video_message: true,
            },
            orderBy: {
              date_created: "desc",
            },
            take: 1,
          },
        },
      });

      return response
        .status(200)
        .json(
          responseWithData("OK", "request successful", direct_conversation)
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
  .get("/messages", async (request, response) => {
    try {
      const query = request.query;

      if (!query.user_id || !query.friend_id)
        return response
          .status(400)
          .json(
            responseWithoutData(
              "BAD_REQUEST",
              "user_id and friend_id is required as a query parameter; /direct-message?user_id=&friend_id="
            )
          );

      const user_id = query.user_id as string;
      const friend_id = query.friend_id as string;

      let count = 20;
      let skip = 0;

      if (query.page) {
        count *= Number(query.page);
        skip = count - 20;
      }

      const dm_id = [user_id, friend_id].sort().join("-");
      const m = await prisma.directConversation.findFirst({
        where: { id: dm_id },
        select: {
          messages: {
            include: {
              text_message: true,
              photo_message: true,
              video_message: true,
            },
            orderBy: {
              date_created: "asc",
            },
            take: count,
            skip,
          },
        },
      });

      return response
        .status(200)
        .json(responseWithData("OK", "request successful", m!.messages));
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

  //delete routes
  .delete("/", async (request, response) => {
    try {
      const { message_id }: Record<string, string> = request.body;

      const found_message = await prisma.directMessage.findFirst({
        where: {
          id: message_id,
        },
      });

      if (!found_message)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "cannot delete message; message does not exist"
            )
          );

      await prisma.directMessage.delete({
        where: {
          id: message_id,
        },
      });

      return response
        .status(200)
        .json(responseWithData("OK", "message deleted", null));
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

const v1_direct_conversation = router;

export default v1_direct_conversation;
