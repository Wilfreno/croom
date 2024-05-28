import { FriendRequest, User } from "@prisma/client";

export type NotificationType = {
  type: "friend-request";
  content: { sender: Omit<User, "password">; message: string };
};
