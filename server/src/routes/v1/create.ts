import {
  DirectConversation,
  Message,
  PhotoMessage,
  ProfilePhoto,
  TextMessage,
  User,
  VideoMessage,
} from "@prisma/client";
import { prisma } from "../../server";
import { Router } from "express";
import { hash } from "bcrypt";
import exclude from "../../lib/exclude";
import { createTransport } from "nodemailer";
import { render } from "@react-email/render";
import OTP from "../../lib/email/OTP";
import {
  badRequest,
  notFoundStatus,
  okStatus,
  serverConflict,
} from "../../lib/response-json";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router.post("/user", async (request, response) => {
  try {
    const user: User & { profile_photo: ProfilePhoto } = request.body;

    const found_user = await prisma.user.findFirst({
      where: { email: user.email },
    });
    if (found_user)
      return response.status(409).json(serverConflict("email already used"));

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
      .json(okStatus("user created", exclude(new_user, ["password"])));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});

router.post("/otp", async (request, response) => {
  const gmail_password = process.env.GMAIL_2FAUTH_APP_PASS;
  if (!gmail_password)
    throw new Error("GMAIL_2FAUTH_APP_PASS is missing from your .env file");
  try {
    const { email } = await request.body;

    const transport = createTransport({
      service: "gmail",
      auth: {
        user: "croom.dev@gmail.com",
        pass: gmail_password,
      },
    });

    const verify = await transport.verify();

    if (!verify) throw new Error("transport verify failed");

    const chars = await hash(email, 5);
    let random_string = "";

    for (let i = 0; i < 6; i++) {
      random_string += chars[Math.floor(Math.random() * chars.length)];
    }
    random_string = random_string.replaceAll(".", chars[2]);
    await prisma.otp.create({
      data: {
        email,
        value: random_string.toUpperCase(),
      },
    });

    const at_index = email.indexOf("@");
    const user_name = email.substring(0, at_index);

    const html = render(OTP({ user_name, otp: random_string }));

    transport.sendMail(
      {
        from: "croom.dev@gmail.com",
        to: email,
        subject:
          "Welcome to Croom your verification code is " +
          random_string.toUpperCase(),
        html,
      },
      (error, info) => {
        if (error) throw new Error(JSON.stringify(info));
      }
    );
    return response.status(200).json(okStatus("OTP created", null));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});

router.post("/friend-request", async (request, response) => {
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
      return response.status(404).json(notFoundStatus("user cannot be found"));

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
});

router.post("/direct-message/text", async (request, response) => {
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
      });
    }

    return response.status(200).json(okStatus("message sent", message));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});

const create_router = router;

export default create_router;
