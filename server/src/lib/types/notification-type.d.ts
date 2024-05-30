import { FriendRequest, User } from "@prisma/client";

export type NotificationType = {
  type: "friend-request" | undefined;
  content: FriendRequest | undefined;
  message: string;
};
