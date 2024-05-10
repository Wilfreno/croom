import express from "express";
import http from "http";
import user_router from "./routes/user";
import { PrismaClient } from "@prisma/client";
import WebsocketServer from "./websocket";

// server configuration
const express_app = express();
const http_server = http.createServer(express_app);
WebsocketServer(http_server);

//prisma_client
export const prisma = new PrismaClient();

//middleware
express_app.use(express.json());

//routes
express_app.get("/", (_, response) => {
  return response.send("hello");
});
express_app.use("/user", user_router);

//server listen
http_server.listen(8000, () =>
  console.log(`server running in ${process.env.NODE_ENV} mode ...`)
);
