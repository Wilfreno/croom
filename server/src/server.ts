import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";

const fastify = Fastify({ logger: true });

//Cross-origin resource sharing restriction
fastify.register(cors, {
  origin:
    process.env.NODE_ENV === "production"
      ? ["https://chatup.vercel.app", "wss://chatup.vercel.app"]
      : ["http://127.0.0.1:3000", "ws://127.0.0.1:3000"],
  methods: ["POST", "GET", "PATCH", "DELETE"],
});

//routes

fastify.get("/", async (request, reply) => {
  return reply.send("hello");
});



