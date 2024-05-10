import { Room, User } from "@prisma/client";

export type WebsocketClientMessage = {
  type: "join" | "leave" | "message" | "kick";
  payload: string;
  room_id: Room["id"];
  user_id: User["id"];
};

export type WebSocketSeverMessage = {
  type: "message" | "error" | "success" | "online" | "offline" | "kicked";
  payload: string;
};
