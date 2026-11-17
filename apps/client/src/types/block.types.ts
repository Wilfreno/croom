import { User } from '@repo/types';

/** A one-to-one conversation the session user blocked; `id` is the conversation id. */
export type Block = {
  id: string;
  blockedUser: Pick<User, 'id' | 'userName' | 'displayName' | 'photo'>;
  blocker: string;
};
