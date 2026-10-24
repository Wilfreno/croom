import { Conversation as ConversationType, Photo } from '@repo/schemas';
import { AuthenticatedUser } from '@repo/types';

export interface User extends Omit<AuthenticatedUser, 'photo'> {
  photo: Photo | null;
}

export interface Conversation extends Omit<ConversationType, 'members' | 'photo'> {
  _id: string;
  members: User;
  photo: Photo | null;
}
