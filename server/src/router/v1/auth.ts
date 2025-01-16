import passport from "@fastify/passport";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { request } from "http";
import { UserSchema } from "src/database/models/User";
import JSONResponse from "src/lib/json-response";

export default async function v1AuthRouter(fastify: FastifyInstance, _: FastifyPluginOptions) {
  let client_url_origin;

  if (process.env.NODE_ENV === "production") {
    client_url_origin = process.env.CLIENT_PRODUCTION_ORIGIN;
    if (!client_url_origin) throw new Error("CLIENT_PRODUCTION_ORIGIN is missing from your .env file");
  } else {
    client_url_origin = process.env.CLIENT_DEVELOPMENT_ORIGIN;
    if (!client_url_origin) throw new Error("CLIENT_DEVELOPMENT_ORIGIN is missing from your .env file");
  }

  fastify.post("/local/login", passport.authenticate("local"));
  fastify.get("/google/login", passport.authenticate("google"));
  fastify.get(
    "/google/callback",
    {
      preValidation: passport.authenticate("google", {
        successRedirect: client_url_origin + "/test",
      }),
    },
    (_, reply) => {
      return reply.code(200);
    }
  );

  fastify.get("/session", async (request, reply) => {
    if (request.isUnauthenticated())
      return reply.code(401).send(JSONResponse("UNAUTHORIZED", "you are not authenticated"));

    return reply.code(200).send(JSONResponse("OK", "request successful", request.user));
  });

  fastify.get("/logout", async (request, reply) => {
    await request.logOut();
    return;
  });
}
