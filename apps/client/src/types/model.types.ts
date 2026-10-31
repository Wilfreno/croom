import {
  Conversation as ConversationType,
  Message as MessageType,
  Photo as PhotoType,
  User as UserType,
} from '@repo/schemas';
import { AuthenticatedUser } from '@repo/types';

export interface UserSession extends Omit<AuthenticatedUser, 'photo'> {
  photo: Photo | null;
}

export interface User extends Omit<UserType, 'photo'> {
  _id: string;
  photo: Photo | null;
}

export interface Conversation extends Omit<ConversationType, 'members' | 'photo' | 'nicknames' | 'blocker' | 'admins'> {
  _id: string;
  members: User[];
  photo: Photo | null;
  nicknames: {
    user: string;
    value: string;
  }[];
  blocker?: string;
  admins: User[];
}

export interface Message extends Omit<MessageType, 'sender' | 'photos'> {
  _id: string;
  sender: User;
  photos: Photo[];
}

export interface Photo extends PhotoType {
  _id: string;
}
