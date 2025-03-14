import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";
import redis from "@fastify/redis";
import JSONResponse from "./lib/json-response";
import v1Router from "./router/v1/v1";
import connectToDB from "./database/connect";
import passport from "@fastify/passport";
import secure_session from "@fastify/secure-session";
import { readFileSync } from "fs";
import path from "path";
import passportStrategy from "./lib/passport/passport-strategy";
import socketio from "fastify-socket.io";
import socketIOServer from "./websocket/socketio-server";

const node_env = process.env.NODE_ENV!;
let client_origin = [];
const redis_host = "127.0.0.1";

if (node_env === "production") {
  const client_origin_1 = process.env.CLIENT_PRODUCTION_ORIGIN_1;
  if (!client_origin_1) throw new Error("CLIENT_PRODUCTION_ORIGIN_1 is missing from your .env file");
  client_origin.push(client_origin_1);

  const client_origin_2 = process.env.CLIENT_PRODUCTION_ORIGIN_2;
  if (!client_origin_2) throw new Error("CLIENT_PRODUCTION_ORIGIN_2 is missing from your .env file");
  client_origin.push(client_origin_2);

  if (!redis_host) throw new Error("REDIS_HOST does not exist as environment variable");
} else {
  const client_origin_1 = process.env.CLIENT_DEVELOPMENT_ORIGIN;
  if (!client_origin_1) throw new Error("CLIENT_DEVELOPMENT_ORIGIN is missing from your .env file");
  client_origin.push(client_origin_1);
}

const fastify = Fastify({
  logger: true,
});

//Cross-origin resource sharing restriction
fastify.register(cors, {
  origin: client_origin,
  methods: ["POST", "GET", "PATCH", "DELETE"],
  credentials: true,
});

//passport js
fastify.register(secure_session, {
  key: readFileSync(path.join(__dirname, "session-key")),
  cookie: { path: "/", maxAge: 60 * 60 * 24 * 30 },
});
fastify.register(passport.initialize());
fastify.register(passport.secureSession());
fastify.register(passportStrategy);

//redis
fastify
  .register(redis, {
    host: redis_host,
    namespace: "storage",
  })
  .register(redis, {
    host: redis_host,
    namespace: "pub",
  })
  .register(redis, {
    host: redis_host,
    namespace: "sub",
  });

//websocket
fastify.register(socketio, {
  cors: {
    origin: client_origin,
    methods: ["POST", "GET"],
    credentials: true,
  },
});
fastify.register(socketIOServer);

//routes
fastify.register(v1Router, { prefix: "/v1" });
fastify.get("/health", async (_, reply) => {
  return reply.code(200).send(JSONResponse("OK", "request successful"));
});

// ensure to connect to the database before the server run
fastify.register(connectToDB).then(async () => {
  await fastify
    .listen({
      port: 8000,
      host: "0.0.0.0",
    })
    .catch((error) => {
      fastify.log.error(error);
      fastify.redis["sub"].unsubscribe("MESSAGE");
      fastify.redis["storage"].quit();
      process.exit(1);
    });
});
