import { Router } from "express";
import { prisma } from "../../server";
import { Room, RoomMember, RoomPhoto } from "@prisma/client";
import { responseWithData, responseWithoutData } from "../../lib/response-json";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router
  //create routes
  .post("/", async (request, response) => {
    try {
      const {
        new_room,
        creator: { user_id },
      }: {
        new_room: Room & { photo: RoomPhoto };
        creator: { user_id: string };
      } = request.body;

      const name = await prisma.room.findFirst({
        where: {
          name: new_room.name,
        },
      });

      if (name)
        return response
          .status(409)
          .json(responseWithoutData("CONFLICT", "room name already taken"));

      const room = await prisma.room.create({
        data: {
          name: new_room.name,
          type: new_room.type,
          photo: {
            create: {
              height: new_room.photo.height,
              width: new_room.photo.width,
              url: new_room.photo.url,
            },
          },
          members: {
            create: {
              id: user_id,
              role: "MODERATOR",
            },
          },
          lounge: {
            create: {
              date_created: new Date(),
            },
          },
        },
        include: {
          photo: true,
        },
      });

      return response
        .status(200)
        .json(responseWithData("OK", "room created", room));
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
  .post("/invite", async (request, response) => {
    try {
      const { user_id, room_id }: Record<string, string> = request.body;

      if (!user_id)
        return response
          .status(400)
          .json(
            responseWithoutData(
              "BAD_REQUEST",
              " user_id and room_id field on the request body is required"
            )
          );

      const found_user = await prisma.user.findFirst({
        where: {
          id: user_id,
        },
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

      let code = "";

      for (let i = 0; i < 12; i++) {
        code += room_id[Math.floor(Math.random() * room_id.length)];
      }

      const room_invite = await prisma.roomInvite.create({
        data: {
          code,
          room_id,
        },
      });

      return response
        .status(200)
        .json(responseWithData("OK", "room invite created", room_invite));
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
  .post("/lounge/message/text", async (request, response) => {
    try {
      const { sender_id, room_id, text } = request.body;

      const found_user = await prisma.roomMember.findFirst({
        where: {
          id: sender_id,
          room_id,
        },
      });

      if (!found_user)
        return response
          .status(409)
          .json(responseWithoutData("CONFLICT", "user is not a room member"));

      const lounge = await prisma.lounge.update({
        where: { id: room_id },
        data: {
          messages: {
            create: {
              type: "TEXT",
              sender_id,
              text_message: {
                create: {
                  content: text,
                },
              },
            },
          },
        },
        select: {
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  display_name: true,
                  profile_photo: true,
                },
              },
              text_message: {
                select: {
                  content: true,
                },
              },
            },
            orderBy: {
              date_created: "desc",
            },
            take: 1,
          },
        },
      });

      return response
        .status(400)
        .json(responseWithData("OK", "message sent", lounge.messages[0]));
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
  .post("/session", async (request, response) => {
    try {
      const { member_id, room_id, session_name } = request.body;

      const found_room = await prisma.room.findFirst({
        where: { id: room_id },
      });

      if (!found_room)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "cannot process request; room does not exist"
            )
          );

      const found_member = await prisma.roomMember.findFirst({
        where: { id: member_id, role: "MODERATOR", room_id },
      });

      if (!found_member)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "only room moderators can create a room session"
            )
          );

      const session = await prisma.session.create({
        data: {
          name: session_name,
          room: {
            connect: {
              id: room_id,
            },
          },
        },
      });

      return response
        .status(200)
        .json(responseWithData("OK", "new room session created", session));
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
  .post("/session/message/text", async (request, response) => {
    try {
      const { session_id, sender_id, text } = request.body;

      const found_session = await prisma.session.findFirst({
        where: {
          id: session_id,
        },
      });

      if (!found_session)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "cannot send message; room session does not exist"
            )
          );

      const found_member = await prisma.roomMember.findFirst({
        where: {
          id: sender_id,
          room_id: found_session.room_id!,
        },
      });

      if (!found_member)
        return response
          .status(409)
          .json(responseWithoutData("CONFLICT", "user is not a room member"));

      const session = await prisma.session.update({
        where: {
          id: session_id,
        },
        data: {
          messages: {
            create: {
              type: "TEXT",
              sender_id,
              text_message: {
                create: {
                  content: text,
                },
              },
            },
          },
        },
        select: {
          messages: {
            include: {
              text_message: true,
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
        .json(responseWithData("OK", "message sent", session.messages));
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
  .get("/list/:name", async (request, response) => {
    try {
      const name = request.params.name;

      const room = await prisma.room.findMany({
        where: { name: { contains: name } },
        include: {
          members: {
            take: 5,
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      if (room.length < 1)
        return response
          .status(404)
          .json(responseWithoutData("NOT_FOUND", "no room found"));

      return response
        .status(200)
        .json(responseWithData("OK", "request successful", room));
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
  .get("/:id/members", async (request, response) => {
    try {
      const room_id = request.params.id;

      const found_room = await prisma.room.findFirst({
        where: {
          id: room_id,
        },
      });

      if (!found_room)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "cannot process request; room does not exist"
            )
          );

      const room_members = await prisma.roomMember.findMany({
        where: {
          room_id,
        },
        include: {
          user: {
            select: {
              id: true,
              user_name: true,
              display_name: true,
              profile_photo: true,
            },
          },
        },
        orderBy: {
          role: "desc",
          user: {
            user_name: "asc",
          },
        },
      });

      return response
        .status(200)
        .json(responseWithData("OK", "request successful", room_members));
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
      const room_id = request.params.id;

      const room = await prisma.room.findFirst({
        where: { id: room_id },
        include: {
          photo: true,
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  display_name: true,
                  user_name: true,
                  profile_photo: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      if (!room)
        return response
          .status(404)
          .json("cannot find room; room does not exist");

      return response
        .status(200)
        .json(responseWithData("OK", "request successful", room));
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
  .get("/lounge/messages/:id", async (request, response) => {
    try {
      const room_id = request.params.id;
      const query = request.query;

      let take = 20;
      let skip = 0;

      if (query.page) {
        take *= Number(query.page);
        skip = take - 20;
      }

      const lounge = await prisma.lounge.findFirst({
        where: {
          id: room_id,
        },
        select: {
          messages: {
            include: {
              text_message: true,
              photo_message: true,
              video_message: true,
            },
            take,
            skip,
            orderBy: {
              date_created: "desc",
            },
          },
        },
      });

      if (!lounge)
        return response
          .status(404)
          .json(
            responseWithoutData(
              "NOT_FOUND",
              "cannot find lounge; roo, does not exist "
            )
          );

      return response
        .status(200)
        .json(responseWithData("OK", "request successful", lounge.messages));
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
  .get("/session/messages/:id", async (request, response) => {
    try {
      const session_id = request.params.id;
      const query = request.query;

      let take = 20;
      let skip = 0;

      if (query.page) {
        take *= Number(query.page);
        skip = take - 20;
      }

      const session = await prisma.session.findFirst({
        where: { id: session_id },
        select: {
          messages: {
            include: {
              text_message: true,
              photo_message: true,
              video_message: true,
            },
            take,
            skip,
            orderBy: {
              date_created: "desc",
            },
          },
        },
      });

      if (!session)
        return response
          .status(404)
          .json(
            responseWithoutData("NOT_FOUND", "room session does not exist")
          );

      return response
        .status(200)
        .json(responseWithData("OK", "request successful", session.messages));
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
  .patch("/add-member", async (request, response) => {
    try {
      const { room_id, member_id } = request.body;

      const found_room = await prisma.room.findFirst({
        where: { id: room_id },
      });

      if (!found_room)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "cannot process request; room does not exist"
            )
          );

      const found_user = await prisma.user.findFirst({
        where: { id: member_id },
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

      await prisma.room.update({
        where: { id: room_id },
        data: {
          members: {
            create: {
              id: member_id,
              role: "MEMBER",
            },
          },
        },
      });

      return response
        .status(200)
        .json(responseWithData("OK", "added a member", null));
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
  .patch("/member-role", async (request, response) => {
    try {
      const {
        room_id,
        member_id,
        role,
      }: Record<string, string> & { role: RoomMember["role"] } = request.body;

      const found_room = await prisma.room.findFirst({
        where: { id: room_id },
      });

      if (!found_room)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "cannot process request; room does not exist"
            )
          );

      const found_member = await prisma.roomMember.findFirst({
        where: {
          id: member_id,
          room_id,
        },
      });

      if (!found_member)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "cannot process request; user is not a member"
            )
          );

      await prisma.roomMember.update({
        where: {
          id: member_id,
          room_id,
        },
        data: {
          role,
        },
      });

      return response
        .status(200)
        .json(responseWithData("OK", "role updated", null));
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
      const {
        room_id,
        moderator: { user_id },
      } = request.body;

      const found_room = await prisma.room.findFirst({
        where: { id: room_id },
        select: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      if (!found_room)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "cannot delete room; room does not exist"
            )
          );

      if (found_room._count.members > 1)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "cannot delete room if there's still members"
            )
          );

      const found_member = await prisma.roomMember.findFirst({
        where: {
          id: user_id,
          room_id,
          role: "MODERATOR",
        },
      });

      if (!found_member)
        return response
          .status(401)
          .json(
            responseWithoutData(
              "UNAUTHORIZED",
              "user must be a room member and a room moderator to process the request"
            )
          );

      await prisma.room.delete({
        where: { id: room_id },
      });

      return response
        .status(200)
        .json(responseWithData("OK", "room deleted", null));
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
  .delete("/member", async (request, response) => {
    try {
      const { room_id, member_id, moderator_id } = request.body;

      const found_room = await prisma.room.findFirst({
        where: { id: room_id },
      });

      if (!found_room)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "cannot process request; room does not exist"
            )
          );

      const found_moderator = await prisma.roomMember.findFirst({
        where: {
          id: moderator_id,
          room_id,
          role: "MODERATOR",
        },
      });

      if (!found_moderator)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "cannot process request; moderator_id is not found"
            )
          );

      const found_member = await prisma.roomMember.findFirst({
        where: {
          id: member_id,
          room_id,
        },
      });

      if (!found_member)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "cannot process request; member_id does not exist"
            )
          );

      await prisma.roomMember.delete({
        where: {
          id: member_id,
          room_id,
        },
      });

      return response
        .status(200)
        .json(
          responseWithData(
            "OK",
            "user deleted from the room's member list",
            null
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
  .delete("/session", async (request, response) => {
    try {
      const { session_id, member_id } = request.body;

      const found_session = await prisma.session.findFirst({
        where: { id: session_id },
      });

      if (!found_session)
        return response
          .status(409)
          .json(
            responseWithoutData(
              "CONFLICT",
              "cannot process request; room session does not exist"
            )
          );

      const found_moderator = await prisma.roomMember.findFirst({
        where: {
          id: member_id,
          room_id: found_session.room_id!,
          role: "MODERATOR",
        },
      });

      if (!found_moderator)
        return response
          .status(401)
          .json(
            responseWithoutData(
              "UNAUTHORIZED",
              "only room moderators can delete a room session"
            )
          );

      await prisma.session.delete({
        where: {
          id: session_id,
        },
      });

      return response
        .status(200)
        .json(responseWithData("OK", "room session deleted", null));
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

const v1_room = router;

export default v1_room;
