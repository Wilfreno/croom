import { SECONDS_IN_DAY, SECONDS_IN_WEEK, SECONDS_IN_YEAR } from '@repo/constants';
import { Conversation } from '@repo/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isGroupChat(conversation: Conversation) {
  return conversation.members.length > 2;
}

export function getTimeIntervalText(dateCreated: Date) {
  const dateSent = new Date(dateCreated);
  const relativeDateInSeconds = Math.floor((Date.now() - dateSent.getTime()) / 1000);

  const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(dateSent);

  if (relativeDateInSeconds > SECONDS_IN_YEAR)
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(dateSent) + ' ' + time;

  if (relativeDateInSeconds > SECONDS_IN_WEEK)
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(dateSent) + ' ' + time;

  if (relativeDateInSeconds > SECONDS_IN_DAY * 2)
    return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dateSent) + ' ' + time;

  if (relativeDateInSeconds > SECONDS_IN_DAY) return 'Yesterday, ' + time;

  return time;
}

/** Whole seconds between two dates, regardless of which one is earlier. */
export function getSecondsInterval(firstDate: Date, secondDate: Date) {
  return Math.floor(Math.abs(firstDate.getTime() - secondDate.getTime()) / 1000);
}
