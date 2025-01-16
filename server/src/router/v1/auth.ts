import passport from "@fastify/passport";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import JSONResponse from "../../lib/json-response";

export default async function v1AuthRouter(
  fastify: FastifyInstance,
  _: FastifyPluginOptions
) {
  let client_url_origin;

  if (process.env.NODE_ENV === "production") {
    client_url_origin = process.env.CLIENT_PRODUCTION_ORIGIN;
    if (!client_url_origin)
      throw new Error("CLIENT_PRODUCTION_ORIGIN is missing from your .env file");
  } else {
    client_url_origin = process.env.CLIENT_DEVELOPMENT_ORIGIN;
    if (!client_url_origin)
      throw new Error("CLIENT_DEVELOPMENT_ORIGIN is missing from your .env file");
  }

  fastify.post("/local/login", passport.authenticate("local"));
  fastify.get("/google/login", passport.authenticate("google"));
  fastify.get(
    "/google/callback",
    {
      preValidation: passport.authenticate("google", {
        successRedirect: client_url_origin + "/",
      }),
    },
    (_, reply) => {
      return reply.code(200);
    }
  );

  fastify.get("/session", async (request, reply) => {
    console.log("isUnauthenticated:: ", request.isUnauthenticated());
    console.log("isAuthenticated:: ", request.isAuthenticated());
    if (request.isUnauthenticated())
      return reply
        .code(401)
        .send(JSONResponse("UNAUTHORIZED", "you are not authenticated"));

    return reply.code(200).send(JSONResponse("OK", "request successful", request.user));
  });

  fastify.get("/logout", async (request, reply) => {
    await request.logOut();
    return reply.redirect(client_url_origin + "/");
  });
}
