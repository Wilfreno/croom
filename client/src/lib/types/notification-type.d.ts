import { FriendRequest, User } from "./user-type";

export type NotificationType = {
  type: "friend-request" | undefined;
  content: FriendRequest | undefined;
  message: string;
};
