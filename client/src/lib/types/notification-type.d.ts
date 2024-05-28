import { User } from "./user-type";

export type NotificationType = {
  type: "friend-request";
  content: { sender: Omit<User, "password">; message: string };
};
