import { FriendRequest, User } from "./client-types";

export type NotificationType = {
  type: "friend-request" | undefined;
  content: FriendRequest | undefined;
  message: string;
};
