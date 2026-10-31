import { Conversation } from '@/types/model.types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isGroupChat(conversation: Conversation) {
  return conversation.members.length > 2;
}
