import express from "express";
import http from "http";
import WebSocket from "ws";
const express_app = express();
const http_server = http.createServer(express_app);
const websocket_server = new WebSocket.Server({ server: http_server });

websocket_server.on("connection", (socket) => {
  console.log("connected");
});

http_server.listen(8000);
