import { FriendRequest, User } from "./client-types";
import { FriendRequestMessageType } from "./websocket-type";

export type NotificationType = {
  type: "friend-request" | undefined;
  content: FriendRequestMessageType | undefined;
  message: string;
};
