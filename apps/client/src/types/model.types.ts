import { Conversation as ConversationType, Message as MessageType, Photo as PhotoType } from '@repo/schemas';
import { AuthenticatedUser } from '@repo/types';

export interface User extends Omit<AuthenticatedUser, 'photo'> {
  photo: Photo | null;
}

export interface Conversation extends Omit<ConversationType, 'members' | 'photo'> {
  _id: string;
  members: User[];
  photo: Photo | null;
}

export interface Message extends Omit<MessageType, 'sender' | 'photos'> {
  _id: string;
  sender: User;
  photos: Photo[];
}

export interface Photo extends PhotoType {
  _id: string;
}
