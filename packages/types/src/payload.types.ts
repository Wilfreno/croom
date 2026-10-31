import { Conversation, Message, Photo } from '@repo/schemas';
import { AuthenticatedUser } from './auth.types';

/**
 * Documents as the server sends them to the client: references populated and
 * ids as strings. Shared so the API, the socket events and the client agree.
 */

export interface PhotoPayload extends Photo {
  _id: string;
}

export interface UserPayload extends Omit<AuthenticatedUser, 'photo'> {
  photo: PhotoPayload | null;
}

export interface ConversationPayload
  extends Omit<Conversation, 'members' | 'photo'> {
  _id: string;
  members: UserPayload[];
  photo: PhotoPayload | null;
}

export interface MessagePayload extends Omit<Message, 'sender' | 'photos'> {
  _id: string;
  sender: UserPayload;
  photos: PhotoPayload[];
}
