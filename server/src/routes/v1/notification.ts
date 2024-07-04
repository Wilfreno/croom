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
                  "room_invite_id field is required to be :{type: NotificationType} & Record<string, string>on the request body"
                )
              );
          const found_invite = await prisma.notification.findFirst({
            where: {
              owner_id: receiver_id,
              type: "ROOM_INVITE",
              room_invite_id,
            },
          });

          if (found_invite)
            return response
              .status(409)
              .json(JSONResponse("CONFLICT", "already sent a room invite"));

          notification = await prisma.notification.create({
            data: {
              owner_id: receiver_id,
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
  })
  //read routes
  //update routes
  // delete routes
  .delete("/notification", async (request, response) => {
    try {
      const {
        type,
        user_id,
        room_id,
      }: { type: NotificationType } & Record<string, string> = request.body;

      if (!type)
        return response
          .status(400)
          .json(
            JSONResponse(
              "BAD_REQUEST",
              "type field is required on the request body"
            )
          );

      let found_notification: Notification | null;

      
      switch (type) {
        case "ROOM_INVITE": {
          if (!user_id || !room_id)
            return response
              .status(400)
              .json(
                JSONResponse(
                  "BAD_REQUEST",
                  "user_id & room_id field required on the request body"
                )
              );
          const found_user = await prisma.user.findFirst({
            where: {
              id: user_id,
            },
          });

          if (!found_user)
            return response
              .status(404)
              .json(
                JSONResponse(
                  "NOT_FOUND",
                  "cannot process request; user does not exist"
                )
              );

          found_notification = await prisma.notification.findFirst({
            where: {
              owner_id: user_id,
              type: "ROOM_INVITE",
              room_invite: {
                room_id,
              },
            },
          });
          break;
        }

        default:
          return response
            .status(400)
            .json(
              JSONResponse(
                "BAD_REQUEST",
                "field type can only contain NotificationType"
              )
            );
      }

      if (!found_notification!)
        return response
          .status(409)
          .json(
            JSONResponse(
              "CONFLICT",
              "cannot process request; notification does not exist"
            )
          );

      await prisma.notification.delete({
        where: {
          id: found_notification.id,
        },
      });
      return response
        .status(200)
        .json(JSONResponse("OK", "notification deleted"));
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
