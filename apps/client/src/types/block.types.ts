import { User } from '@repo/types';

export type Block = {
  id: string;
  blockedUser: Pick<User, 'id' | 'userName' | 'displayName' | 'photo'>;
  blocker: string;
};
