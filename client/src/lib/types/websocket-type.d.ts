import { NotificationType } from "./notification-type";
import { Room, User } from "./user-type";

export type WebsocketClientMessage = {
  type: "join" | "leave" | "message" | "kick" | "friend-request";
  payload?: string;
  room_id?: Room["id"];
  sender?: User["id"];
  receiver?: User["id"];
};

export type WebSocketSeverMessage = {
  type:
    | "message"
    | "error"
    | "success"
    | "online"
    | "offline"
    | "kicked"
    | "friend-request";
  payload: string | NotificationType;
};
