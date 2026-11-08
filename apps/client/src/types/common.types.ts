import { UserStatus } from '@repo/enums';

export type ConversationInfo = {
  photoUrl: string;
  conversationName: string;
  status: UserStatus | null;
  lastOnline: string;
};
