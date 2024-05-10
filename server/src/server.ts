import express from "express";
import http from "http";
import WebSocket from "ws";

const express_app = express();
const http_server = http.createServer(express_app);
const websocket_server = new WebSocket.Server({ server: http_server });

const environment_mode = process.env.NODE_ENV;

websocket_server.on("connection", (socket) => {
  console.log("connected");
});

console.log("i changed something");
http_server.listen(8000, () =>
  console.log(`server running in ${environment_mode} mode ...`)
);
