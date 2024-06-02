import express from "express";
import http from "http";
import { PrismaClient } from "@prisma/client";
import WebsocketServer from "./websocket";
import { okStatus } from "./lib/response-json";
import cors from "cors";
import v1_router from "./routes/v1/v1";

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
express_app.use("/v1", v1_router)
express_app.get("/", (_, response) => {
  return response.status(200).json(okStatus("server is running", null));
});

//server listen
http_server.listen(8000, () =>
  console.log(`server running in ${process.env.NODE_ENV} mode ...`)
);
