import { compare, hash } from "bcrypt";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import Photo, { type Photo as PhotoType } from "../../database/models/Photo";
import User, { type User as UserType } from "../../database/models/User";
import exclude from "../../lib/exclude";
import JSONResponse from "../../lib/json-response";
import Lobby from "../../database/models/Lobby";

export default function v1UserRouter(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  //create user
  fastify.post<{
    Body: {
      username: string;
      password: string;
      email: string;
      display_name: string;
      provider: "GOOGLE" | "CREDENTIALS";
    };
  }>("/", async (request, reply) => {
    try {
      const { username, password, provider, display_name, email } =
        request.body;
      if (!username)
        return reply
          .code(400)
          .send(
            JSONResponse(
              "BAD_REQUEST",
              "username is required on the request body"
            )
          );
      if (!email)
        return reply
          .code(400)
          .send(
            JSONResponse("BAD_REQUEST", "email is required on the request body")
          );

      if (await User.exists({ email }))
        return reply
          .code(400)
          .send(JSONResponse("BAD_REQUEST", "email already used"));

      if (!provider)
        return reply
          .code(400)
          .send(
            JSONResponse(
              "BAD_REQUEST",
              'provider is required on the request body with "GOOGLE" | "CREDENTIALS" as its value'
            )
          );

      if (!username.startsWith("@"))
        return reply
          .code(400)
          .send(JSONResponse("BAD_REQUEST", "username must start with @"));

      if (await User.exists({ username }))
        return reply
          .code(409)
          .send(JSONResponse("CONFLICT", "user already exist"));

      if (provider === "CREDENTIALS" && password.length < 8)
        return reply
          .code(400)
          .send(
            JSONResponse(
              "BAD_REQUEST",
              "password must be at least 8 characters long"
            )
          );

      const new_user = new User({
        display_name:
          provider === "CREDENTIALS" ? display_name : username.substring(1),
        username,
        password: provider === "CREDENTIALS" ? await hash(password, 14) : null,
        email,
        last_updated: new Date(),
      });

      await new_user.save();

      return reply
        .code(201)
        .send(JSONResponse("CREATED", "new user created", new_user.toJSON()));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  fastify.post<{
    Body: {
      username: string;
      password: string;
    };
  }>("/auth", async (request, reply) => {
    try {
      const { username, password } = request.body;

      if (!username)
        return reply
          .code(400)
          .send(
            JSONResponse(
              "BAD_REQUEST",
              "username is required on the request body"
            )
          );

      if (!username.startsWith("@"))
        return reply
          .code(400)
          .send(JSONResponse("BAD_REQUEST", "username must start with @"));

      const found_user = await User.findOne({ username }).populate("photo");

      if (!found_user)
        return reply
          .code(404)
          .send(JSONResponse("NOT_FOUND", "user does not exist"));

      if (!found_user.password)
        return reply
          .code(403)
          .send(
            JSONResponse(
              "FORBIDDEN",
              "you can only login with this account using Google OAuth"
            )
          );

      if (!(await compare(password, found_user.password)))
        return reply
          .code(401)
          .send(JSONResponse("UNAUTHORIZED", "incorrect password"));

      return reply
        .code(200)
        .send(
          JSONResponse(
            "OK",
            "user authenticated",
            exclude(found_user.toJSON(), ["password"])
          )
        );
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  fastify.post<{ Body: { id: string } }>("/session", async (request, reply) => {
    try {
      const { id } = request.body;

      if (!id)
        return reply
          .code(400)
          .send(
            JSONResponse("BAD_REQUEST", "id is required on the request body")
          );

      const found_user = await User.findOne({ _id: id }).select("-password");

      if (!found_user)
        return reply
          .code(404)
          .send(JSONResponse("NOT_FOUND", "user does not exist"));

      const token = fastify.jwt.sign(found_user.toJSON());

      return reply
        .code(200)
        .setCookie("chatup-session-token", token, {
          domain:
            process.env.NODE_ENV === "production"
              ? "chatup.vercel.app"
              : "127.0.0.1",
          path: "/",
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          httpOnly: true,
          maxAge: 60 * 60 * 14 * 30,
        })
        .send(JSONResponse("OK", "user session is created"));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });
  //read user
  fastify.get<{ Params: { username: string } }>(
    "/:username",
    async (request, reply) => {
      try {
        const { username } = request.params;

        const found_user = await User.findOne({ username })
          .populate("photo")
          .select("-password");

        if (!found_user)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "user does not exist"));

        return reply
          .code(200)
          .send(JSONResponse("OK", "request successful", found_user.toJSON()));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id/lobbies",
    async (request, reply) => {
      try {
        const { id } = request.params;

        const found_user = await User.findOne({ _id: id });
        if (!found_user)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "user does not exist"));

        const lobbies = [];

        for (const lobby_id of found_user.lobbies) {
          const found_lobby = await Lobby.findOne({ _id: lobby_id }).populate(
            "photo"
          );
          lobbies.push(found_lobby!.toJSON());
        }

        console.log("LOBBIES", lobbies)
        return reply
          .code(200)
          .send(JSONResponse("OK", "request successful", lobbies));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  //update user
  fastify.patch<{
    Params: { key: keyof UserType };
    Body: Omit<UserType, "photo"> & { photo: PhotoType; id: string };
  }>("/:key", async (request, reply) => {
    try {
      const { key } = request.params;
      const { username, id, display_name, password, photo, status, is_new } =
        request.body;

      if (!id)
        return reply
          .code(400)
          .send(
            JSONResponse("BAD_REQUEST", "id is required on the request body")
          );

      const found_user = await User.findOne({ _id: id });

      if (!found_user)
        return reply
          .code(404)
          .send(JSONResponse("NOT_FOUND", "user does not exist"));

      switch (key) {
        case "username": {
          if (!username)
            return reply
              .code(400)
              .send(
                JSONResponse(
                  "BAD_REQUEST",
                  "username is required on the request body"
                )
              );

          await User.updateOne(
            { _id: id },
            { $set: { username, last_updated: new Date() } }
          );

          break;
        }

        case "display_name": {
          if (!display_name)
            return reply
              .code(400)
              .send(
                JSONResponse(
                  "BAD_REQUEST",
                  "display_name is required on the request body"
                )
              );

          await User.updateOne(
            { _id: id },
            { $set: { display_name, last_updated: new Date() } }
          );

          break;
        }
        case "password": {
          if (!password)
            return reply
              .code(400)
              .send(
                JSONResponse(
                  "BAD_REQUEST",
                  "password is required on the request body"
                )
              );

          await User.updateOne(
            { _id: id },
            {
              $set: {
                password: await hash(password, 14),
                last_updated: new Date(),
              },
            }
          );

          break;
        }
        case "photo": {
          if (!photo)
            return reply
              .code(400)
              .send(
                JSONResponse(
                  "BAD_REQUEST",
                  "photo is required on the request body"
                )
              );

          const new_photo = new Photo({
            owner: found_user._id,
            type: "PROFILE",
            url: photo.url,
          });

          await new_photo.save();

          if (found_user.photo)
            await Photo.deleteOne({ _id: found_user.photo });

          await User.updateOne(
            { _id: id },
            { $set: { photo: new_photo._id, last_updated: new Date() } }
          );

          break;
        }
        case "status": {
          if (!status)
            return reply
              .code(400)
              .send(
                JSONResponse(
                  "BAD_REQUEST",
                  "status is required on the request body"
                )
              );

          await User.updateOne(
            { _id: id },
            { $set: { status, last_updated: new Date() } }
          );

          break;
        }
        case "is_new": {
          await User.updateOne(
            { _id: id },
            { $set: { is_new, last_updated: new Date() } }
          );

          break;
        }
        default: {
          return reply
            .code(400)
            .send(
              JSONResponse(
                "BAD_REQUEST",
                "request parameter mus be a key of User"
              )
            );
        }
      }

      const new_user = await User.findOne({ _id: id })
        .populate("photo")
        .select("-password");

      return reply
        .code(200)
        .send(
          JSONResponse("OK", "user " + key + " is updated", new_user?.toJSON())
        );
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });

  //delete user

  fastify.delete<{ Params: { username: string } }>(
    "/:username",
    async (request, reply) => {
      try {
        const { username } = request.params;

        const found_user = await User.exists({ username });

        if (!found_user)
          return reply
            .code(404)
            .send(
              JSONResponse(
                "CONFLICT",
                " cannot delete user user does not exist"
              )
            );

        await User.deleteOne({ username });

        return reply.code(200).send(JSONResponse("OK", "user deleted"));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );

  fastify.delete(
    "/session",
    {
      preValidation: async (request) => await request.jwtVerify(),
    },
    async (request, reply) => {
      try {
        return reply
          .code(200)
          .setCookie("chatup-session-token", "", {
            domain:
              process.env.NODE_ENV === "production"
                ? "chatup.vercel.app"
                : "127.0.0.1",
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            httpOnly: true,
            maxAge: 0,
          })
          .send(JSONResponse("OK", "user session is created"));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );
  done();
}
