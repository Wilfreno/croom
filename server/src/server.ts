import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import "dotenv/config";
import connectToDB from "./database/connect";
import websocketServer from "./websocket/websocket-server";
import jwt from "@fastify/jwt";
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

//JWT
fastify.register(jwt);

//websocket
fastify.register(websocket);
fastify.register(websocketServer);

//routes
fastify.get("/", async (request, reply) => {
  return reply.send("hello");
});

// ensure to connect to the database before the server run
fastify.register(connectToDB).then(() =>
  fastify
    .listen(
      process.env.NODE_ENV === "production"
        ? { port: 8000, host: "0.0.0.0" }
        : { port: 8000 }
    )
    .catch((error) => {
      fastify.log.error(error);
      process.exit(1);
    })
);
