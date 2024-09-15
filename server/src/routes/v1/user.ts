import { compare, hash } from "bcrypt";
import { FastifyInstance } from "fastify";
import Photo, { type Photo as PhotoType } from "src/database/models/Photo";
import User, { type User as UserType } from "src/database/models/User";
import exclude from "src/lib/exclude";
import JSONResponse from "src/lib/json-response";

export default async function v1UserRouter(fastify: FastifyInstance) {
  //create user
  fastify.post<{
    Body: {
      username: string;
      password: string;
      provider: "GOOGLE" | "CREDENTIALS";
    };
  }>("/", async (request, reply) => {
    try {
      const { username, password, provider } = request.body;

      if (!username)
        return reply
          .code(400)
          .send(
            JSONResponse(
              "BAD_REQUEST",
              "username is required on the request body"
            )
          );

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

      const new_user = new User({
        username,
        password: provider === "CREDENTIALS" ? await hash(password, 14) : null,
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

  //update user
  fastify.patch<{
    Params: { key: keyof UserType };
    Body: Omit<UserType, "photo"> & { photo: PhotoType; new_username: string };
  }>("/:key", async (request, reply) => {
    try {
      const { key } = request.params;
      const { username, new_username, password, photo, status } = request.body;

      if (!username)
        return reply
          .code(400)
          .send(
            JSONResponse(
              "BAD_REQUEST",
              "username is required on the request body"
            )
          );

      const found_user = await User.findOne({ username });

      if (!found_user)
        return reply
          .code(404)
          .send(JSONResponse("NOT_FOUND", "user does not exist"));

      switch (key) {
        case "username": {
          if (!new_username)
            return reply
              .code(400)
              .send(
                JSONResponse(
                  "BAD_REQUEST",
                  "new_username is required on the request body"
                )
              );

          await User.updateOne(
            { username },
            { $set: { username: new_username, last_updated: new Date() } }
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
            { username },
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
            { username },
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
            { username },
            { $set: { status, last_updated: new Date() } }
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

      const new_user = await User.findOne({ username })
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
}
