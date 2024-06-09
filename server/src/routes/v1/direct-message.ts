import { Message } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../../server";
import { badRequest, okStatus, serverConflict } from "../../lib/response-json";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router
  .post("/text", async (request, response) => {
    try {
      const { sender_id, receiver_id, text }: Record<string, string> =
        request.body;

      const dm_id = [sender_id, receiver_id].sort().join("-");

      const found_conversation = await prisma.directConversation.findFirst({
        where: { id: dm_id },
      });

      let message: Message;

      if (found_conversation) {
        message = await prisma.message.create({
          data: {
            conversation_id: found_conversation.id,
            sender_id,
            receiver_id,
            text_message: {
              create: {
                content: text,
              },
            },
            type: "text",
          },
          include: {
            text_message: true,
          },
        });
        await prisma.directConversation.update({
          where: { id: found_conversation.id },
          data: {
            messages: {
              connect: {
                id: message.id,
              },
            },
          },
          select: {
            messages: {
              orderBy: {
                date_created: "desc",
              },
              take: 1,
            },
          },
        });
      } else {
        const direct_conversation = await prisma.directConversation.create({
          data: {
            id: dm_id,
            user1_id: sender_id,
            user2_id: receiver_id,
          },
        });

        message = await prisma.message.create({
          data: {
            conversation_id: direct_conversation.id,
            sender_id,
            receiver_id,
            text_message: {
              create: {
                content: text,
              },
            },
            type: "text",
          },
          include: {
            text_message: true,
          },
        });
      }

      return response.status(200).json(okStatus("message sent", message));
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response.status(400).json(badRequest());
    }
  })
  .get("/", async (request, response) => {
    try {
      const query = request.query;

      if (!query.user_id || !query.friend_id)
        return response
          .status(400)
          .json(
            badRequest(
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
        .json(okStatus("request succesfull", m!.messages));
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response.status(400).json(badRequest());
    }
  })
  .delete("/", async (request, response) => {
    try {
      const { message_id }: Record<string, string> = request.body;

      const found_message = await prisma.message.findFirst({
        where: {
          id: message_id,
        },
      });

      if (!found_message)
        return response
          .status(409)
          .json(
            serverConflict("cannot delete message; message does not exist")
          );

      await prisma.message.delete({
        where: {
          id: message_id,
        },
      });

      return response.status(200).json(okStatus("message deleted", null));
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response.status(400).json(badRequest());
    }
  });

const v1_direct_message = router;

export default v1_direct_message;
