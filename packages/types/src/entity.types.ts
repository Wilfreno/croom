import {
  Conversation as ConversationType,
  Message as MessageType,
  Photo as PhotoType,
  User as UserType,
} from '@repo/schemas';
import { AuthenticatedUser } from './auth.types';

export interface UserSession extends Omit<AuthenticatedUser, 'photo'> {
  photo: Photo | null;
}

export interface User extends Omit<UserType, 'photo'> {
  id: string;
  photo: Photo | null;
}

export interface Conversation extends Omit<ConversationType, 'members' | 'photo' | 'nicknames' | 'blocker' | 'admins'> {
  id: string;
  members: User[];
  photo: Photo | null;
  nicknames: {
    user: string;
    value: string;
  }[];
  blocker?: string;
  admins: User[];
  messages: Message[]
}

export interface Message extends Omit<MessageType, 'sender' | 'photos' | 'conversation'> {
  id: string;
  conversation: string; // the conversation's id; message lists don't include the full conversation
  sender: User;
  photos: Photo[];
}

/** A message as emitted over the socket: its conversation carries only the id and nicknames. */
export interface MessagePayload extends Omit<Message, 'conversation'> {
  conversation: Pick<Conversation, 'id' | 'nicknames'>;
}

export interface Photo extends PhotoType {
  id: string;
}
