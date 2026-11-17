import type { Conversation, MessagePayload } from '@repo/types';

export type Nickname = Conversation['nicknames'][number];

export type SetNicknameResult = Nickname & { message: MessagePayload | null };
