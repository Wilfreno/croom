import { UserStatus } from '@repo/enums';

export type ConversationInfo = {
  photoUrl: string;
  conversationName: string;
  status: UserStatus | null;
  /** At least one other member is online. */
  isOnline: boolean;
  lastOnline: string;
};
