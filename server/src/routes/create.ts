import { Message, Photo, Room, User, Video } from "@prisma/client";
import { prisma } from "../server";
import { Router } from "express";
import { okStatus, serverConflict, serverError } from "../lib/response-json";
import { hash } from "bcrypt";
import exclude from "../lib/exclude";
import { createTransport } from "nodemailer";
import { render } from "@react-email/render";
import OTP from "../lib/email/OTP";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router.post("/user", async (request, response) => {
  try {
    const user: User & { profile_pic: Photo } = await request.body;

    const found_user = await prisma.user.findFirst({
      where: { email: user.email },
    });
    console.log("user::", user);
    if (found_user)
      return response.status(409).json(serverConflict("email already used"));

    const new_user = await prisma.user.create({
      data: {
        display_name: user.display_name,
        user_name: user.user_name,
        email: user.email,
        birth_date: user.birth_date,
        profile_pic: {
          create: {
            photo_url: user.profile_pic.photo_url,
          },
        },
        password: await hash(user.password, 14),
      },
      include: {
        profile_pic: true,
      },
    });

    return response
      .status(200)
      .json(okStatus("user created", exclude(new_user, ["password"])));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(500).json(serverError());
  }
});

router.post("/room", async (request, response) => {
  try {
    const room: Room = request.body;

    const found_room = await prisma.room.findFirst({
      where: { name: room.name },
    });

    if (found_room)
      return response
        .status(409)
        .json(serverConflict("room name already exist"));

    const new_room = await prisma.room.create({
      data: {
        ...room,
      },
    });

    return response
      .status(200)
      .json(okStatus("room created successfully", new_room));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(500).json(serverError());
  }
});

router.post("/message", async (request, response) => {
  try {
    const message: Message & { video?: Video } & { photos?: Photo[] } =
      request.body;

    const new_message = await prisma.message.create({
      data: {
        type: message.type,
        text: message.text,
        room: {
          connect: { id: message.room_id! },
        },
        video: {
          connectOrCreate: {
            where: {
              id: message.video?.id!,
            },
            create: {
              length: message.video?.length!,
              name: message.video?.name!,
              video_url: message.video?.video_url!,
              owner_id: message.owner_id!,
            },
          },
        },
        photos: {
          create: message.photos?.map((photo) => ({
            id: photo.id,
            photo_url: photo.photo_url,
            owner_id: message.owner_id,
          })),
        },
      },
      include: { room: true, owner: true, video: true, photos: true },
    });
    return response.status(200).json(okStatus("message sent", new_message));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(500).json(serverError());
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

    if (!verify) throw new Error("trasnport verify failed");

    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let random_string = "";

    for (let i = 0; i < 6; i++) {
      random_string +=
        chars[Math.floor(Math.random() * new Date().getTime()) % chars.length];
    }

    await prisma.otp.create({
      data: {
        email,
        value: random_string,
      },
    });

    const at_index = email.indexof("@");
    const user_name = email.substring(0, at_index);

    const html = render(OTP({ user_name, otp: random_string }));

    transport.sendMail(
      {
        from: "croom.dev@gmail.com",
        to: email,
        subject: "Welcome to Croom your verification code is " + random_string,
        html,
      },
      (error, info) => {
        if (error) throw new Error(JSON.stringify(info));
      }
    );
    return response.status(200).json(okStatus("OTP created", null));
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(500).json(serverError());
  }
});
const create_router = router;

export default create_router;
