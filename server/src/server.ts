import express from "express";
import http from "http";
import { PrismaClient } from "@prisma/client";
import WebsocketServer from "./websocket";
import user_router from "./routes/user";
import new_router from "./routes/create";
import delete_router from "./routes/delete";
import verify_router from "./routes/authenticate";
import { okStatus } from "./lib/response-json";

// server configuration
const express_app = express();
const http_server = http.createServer(express_app);
WebsocketServer(http_server);

//prisma_client
export const prisma = new PrismaClient();

//middleware
express_app.use(express.json());

//routes
express_app.use("/user", user_router);
express_app.use("/create", new_router);
express_app.use("/delete", delete_router);
express_app.use("/authenticate", verify_router);

//redirecting all get request from non-existing routes
express_app.get("/", (_, response) => {
  return response.status(200).json(okStatus("server is running", null));
});
express_app.get("/*", (_, response) => {
  return response.redirect("/");
});

//server listen
http_server.listen(8000, () =>
  console.log(`server running in ${process.env.NODE_ENV} mode ...`)
);
