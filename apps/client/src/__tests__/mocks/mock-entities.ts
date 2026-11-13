import { UserStatus } from '@repo/enums';
import type { Conversation, Message, Photo, User, UserSession } from '@repo/types';

let counter = 0;
/** A unique 24-hex id, shaped like a Mongo ObjectId. */
export function objectId() {
  counter++;
  return counter.toString(16).padStart(24, '0');
}

export function mockPhoto(overrides: Partial<Photo> = {}): Photo {
  return {
    id: objectId(),
    url: 'https://utfs.io/photo.png',
    key: 'photo-key',
    type: 'image/png',
    width: 100,
    height: 100,
    ...overrides,
  } as Photo;
}

export function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: objectId(),
    email: 'user@example.com',
    userName: '@user',
    displayName: 'User',
    status: UserStatus.ONLINE,
    photo: null,
    lastOnline: new Date(),
    dateCreated: new Date(),
    lastUpdated: new Date(),
    ...overrides,
  } as User;
}

export function mockSession(overrides: Partial<UserSession> = {}): UserSession {
  return mockUser({ displayName: 'Me', userName: '@me', ...overrides }) as unknown as UserSession;
}

export function mockMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: objectId(),
    conversation: objectId(),
    sender: mockUser(),
    text: 'hello',
    photos: [],
    seenBy: [],
    status: '',
    dateCreated: new Date(),
    lastUpdated: new Date(),
    ...overrides,
  } as unknown as Message;
}

/** A conversation as the server lists it: `members` excludes the session user. */
export function mockConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: objectId(),
    name: '',
    members: [mockUser()],
    admins: [],
    nicknames: [],
    photo: null,
    messages: [],
    dateCreated: new Date(),
    lastUpdated: new Date(),
    ...overrides,
  } as unknown as Conversation;
}
