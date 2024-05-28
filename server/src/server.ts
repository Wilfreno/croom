import express from "express";
import http from "http";
import { PrismaClient } from "@prisma/client";
import WebsocketServer from "./websocket";
import new_router from "./routes/create";
import delete_router from "./routes/delete";
import verify_router from "./routes/authenticate";
import { okStatus } from "./lib/response-json";
import cors from "cors";
import get_router from "./routes/get";
import accept_router from "./routes/accept";
import decline_router from "./routes/decline";

// server configuration
const express_app = express();
const http_server = http.createServer(express_app);

//websoket server
WebsocketServer(http_server);

//prisma_client
export const prisma = new PrismaClient();

//middleware
express_app.use(express.json());
express_app.use(cors());

//routes
express_app.use("/create", new_router);
express_app.use("/get", get_router);
express_app.use("/delete", delete_router);
express_app.use("/authenticate", verify_router);
express_app.use("/accept", accept_router);
express_app.use("/decline", decline_router);
express_app.get("/", (_, response) => {
  return response.status(200).json(okStatus("server is running", null));
});

//server listen
http_server.listen(8000, () =>
  console.log(`server running in ${process.env.NODE_ENV} mode ...`)
);
