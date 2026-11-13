import { User } from '@repo/types';

export type Block = {
  id: string;
  blockedUser: User;
  blocker: string;
  conversation: string;
  dateCreated: Date;
};
