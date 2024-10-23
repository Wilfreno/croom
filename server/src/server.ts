import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";
import connectToDB from "./database/connect";
import socketIOServer from "./websocket/socketio-server";
import redis from "@fastify/redis";
import socketio from "fastify-socket.io";
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
  credentials: true,
});

//jwt
const jwt_secret = process.env.JWT_SECRET;
if (!jwt_secret) throw new Error("JWT_SECRET is missing from your .env file");
fastify.register(jwt, {
  secret: jwt_secret,
  cookie: {
    cookieName: "chatup-session-token",
    signed: false,
  },
});

//cookies
const cookie_secret = process.env.COOKIE_SECRET;
if (!cookie_secret)
  throw new Error("COOKIE_SECRET is missing from your .env file");
fastify.register(cookie, { secret: cookie_secret });

//redis
fastify
  .register(redis, {
    host: process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1",
    namespace: "storage",
  })
  .register(redis, {
    host: process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1",
    namespace: "pub",
  })
  .register(redis, {
    host: process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1",
    namespace: "sub",
  });

//websocket
fastify.register(socketio);

//routes
fastify.register(v1Router, { prefix: "/v1" });
fastify.get("/health", async (request, reply) => {
  return reply.code(200).send(JSONResponse("OK", "request successful"));
});

// ensure to connect to the database before the server run
fastify.register(connectToDB).then(() =>
  fastify
    .listen({ port: 8000, host: "0.0.0.0" })
    .then(() => fastify.register(socketIOServer))
    .catch((error) => {
      fastify.log.error(error);

      fastify.redis["sub"].unsubscribe("MESSAGE");
      fastify.redis["sub"].unsubscribe("NOTIFICATION");
      fastify.redis["storage"].quit();
      process.exit(1);
    })
);
