import express from "express";
import http from "http";
import WebSocket from "ws";
import user_router from "./routes/user";
import { PrismaClient } from "@prisma/client";

// server configuration
const express_app = express();
const http_server = http.createServer(express_app);
const websocket_server = new WebSocket.Server({ server: http_server });

//prisma_client
export const prisma = new PrismaClient();

//middleware
express_app.use(express.json());

//routes
express_app.get("/", (_, response) => {
  return response.send("hello");
});
express_app.use("/user", user_router);

//weboscket
websocket_server.on("connection", (socket) => {
  console.log("connected");
});

//server listen
http_server.listen(8000, () =>
  console.log(`server running in ${process.env.NODE_ENV} mode ...`)
);
