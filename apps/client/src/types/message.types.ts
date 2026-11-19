import type { Message } from '@repo/types';
import type { InfiniteData } from '@tanstack/react-query';

export type CachedMessage = Message & {
  pending?: boolean;
  failed?: boolean;
  resending?: boolean;
  clientKey?: string;
};

export type MessagePages = InfiniteData<{ pageParam: number; result: CachedMessage[] }, unknown>;

export type PhotoInput = { id: string; url: string; width: number; height: number };
