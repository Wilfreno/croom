import { hash } from "bcrypt";
import { FastifyInstance } from "fastify";
import { Photo } from "src/database/models/Photo";
import User from "src/database/models/User";
import JSONResponse from "src/lib/json-response";

export default async function v1UserRouter(fastify: FastifyInstance) {
  //create user
  fastify.post<{
    Body: {
      username: string;
      password: string;
      provider: "GOOGLE" | "CREDENTIALS";
      photo: Photo;
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

      const new_user = new User({
        username,
        password: provider === "CREDENTIALS" ? await hash(password, 14) : null,
        last_updated: new Date(),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });
  //read user

  //update user

  //delete user
}
