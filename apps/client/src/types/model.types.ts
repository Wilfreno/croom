import { Conversation as ConversationType, Photo, User as UserType } from '@repo/schemas';

export interface User extends Omit<UserType, 'password' | 'photo'> {
  photo: Photo| null;
}

export interface Conversation extends Omit<ConversationType, 'members' | 'photo'> {
  _id: string;
  members: User;
  photo: Photo | null;
}
