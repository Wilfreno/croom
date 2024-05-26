import { Room, User } from "./user-type";

export type WebsocketClientMessage = {
  type: "join" | "leave" | "message" | "kick" | "friend-request";
  payload: string;
  room_id?: Room["id"];
  user_id: User["id"];
};

export type WebSocketSeverMessage = {
  type:
    | "message"
    | "error"
    | "success"
    | "online"
    | "offline"
    | "kicked"
    | "friend-requestge";
  payload: string;
};
