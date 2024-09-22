import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import "dotenv/config";
import connectToDB from "./database/connect";
import websocketServer from "./websocket/websocket-server";
import redis from "@fastify/redis";

import v1Router from "./routes/v1/v1";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";

import JSONResponse from "./lib/json-response";


const fastify = Fastify({ logger: true });

//middleware
//Cross-origin resource sharing restriction
fastify.register(cors, {
  origin:
    process.env.NODE_ENV === "production"
      ? ["https://chatup.vercel.app", "wss://chatup.vercel.app"]
      : ["http://127.0.0.1:3000", "ws://127.0.0.1:3000"],
  methods: ["POST", "GET", "PATCH", "DELETE"],
});

//jwt
const jwt_secret = process.env.JWT_SECRET;
if (!jwt_secret) throw new Error("JWT_SECRET is missing from your .env file");
fastify.register(jwt, {
  secret: jwt_secret,
  cookie: {
    cookieName: "token",
    signed: true,
  },
});

//cookies
const cookie_secret = process.env.COOKIE_SECRET;
if (!cookie_secret)
  throw new Error("COOKIE_SECRET is missing from your .env file");
fastify.register(cookie, { secret: cookie_secret });

//redis
fastify.register(redis, {
  host: process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1",
});
  
//websocket
fastify.register(websocket);
fastify.register(websocketServer);

//routes
fastify.register(v1Router, { prefix: "/v1" });
fastify.get("/health", async (request, reply) => {
  return reply.code(200).send(JSONResponse("OK", "request successful"));
});

fastify.post(
  "/test",
  {
    preValidation: async (request, reply) => {
      await request.jwtVerify();
    },
  },
  async (request, reply) => {
    try {
      return reply
        .code(200)
        .send(JSONResponse("OK", "request successful", request.user));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  }
);
// ensure to connect to the database before the server run
fastify.register(connectToDB).then(() =>
  fastify
    .listen(
      process.env.NODE_ENV === "production"
        ? { port: 8000, host: "0.0.0.0" }
        : { port: 8000, host: "localhost" }
    )
    .catch((error) => {
      fastify.log.error(error);
      process.exit(1);
    })
);
