import { Router } from "express";
import { JSONResponse } from "../../lib/response-json";
import { prisma } from "../../server";
import { Notification, NotificationType } from "@prisma/client";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router
  //create routes
  .post("/", async (request, response) => {
    try {
      const {
        type,
        room_invite_id,
        receiver_id,
      }: { type: NotificationType } & Record<string, string> = request.body;

      let notification: Notification;

      switch (type) {
        case "ROOM_INVITE": {
          if (!room_invite_id)
            return response
              .status(400)
              .json(
                JSONResponse(
                  "BAD_REQUEST",
                  "room_invite_id field is required to be on the request body"
                )
              );

          notification = await prisma.notification.create({
            data: {
              id: receiver_id,
              type: "ROOM_INVITE",
              room_invite_id,
            },
            include: {
              room_invite: {
                include: {
                  room: {
                    include: {
                      photo: true,
                    },
                  },
                },
              },
            },
          });
        }
      }

      return response
        .status(200)
        .json(JSONResponse("OK", "notification created", notification!));
    } catch (error) {
      if (environment_mode === "development") console.error(error);
      return response
        .status(500)
        .json(
          JSONResponse("INTERNAL_SERVER_ERROR", "oops! something went wrong")
        );
    }
  });

const v1_notification = router;

export default v1_notification;
