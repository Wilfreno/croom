import {
  closeSession,
  cn,
  emitSocketEventAndWaitForServerReply,
  getAvatarColor,
  getConversationName,
  getGroupAvatarMembers,
  getInitials,
  isBlockedError,
  isBlockedMember,
  isConversationOnline,
  getMediaErrorMessage,
  formatCallDuration,
  getCallNoticeText,
  getNicknameNoticeText,
  getNoticeText,
  isCallNotice,
  getSecondsInterval,
  getTimeIntervalText,
  isSameSender,
  peopleLabel,
} from '@/lib/utils';
import type { CallSession } from '@/types/call.types';
import type { TypedSocket } from '@/types/socket.types';
import { AVATAR_FALLBACK_COLORS, SECONDS_IN_DAY, SOCKET_SERVER_REPLY_TIMEOUT_MS } from '@repo/constants';
import { ConversationStatus, MessageNoticeType, UserStatus } from '@repo/enums';
import type { Conversation } from '@repo/types';
import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const NOW = new Date('2026-11-13T15:30:00');

function secondsAgo(seconds: number) {
  return new Date(NOW.getTime() - seconds * 1000);
}

function time(date: Date) {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date);
}

describe('cn', () => {
  it('joins classes and drops falsy ones', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c');
  });

  it('lets a later tailwind class override a conflicting earlier one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});

describe('isBlockedError', () => {
  const responseError = (status: number, body: unknown) =>
    new AxiosError(String(status), undefined, undefined, undefined, { status, data: body } as never);

  it('is true for a BLOCKED server response', () => {
    expect(isBlockedError(responseError(423, { status: 'BLOCKED', message: '', data: null }))).toBe(true);
  });

  it.each([
    ['another server status', responseError(404, { status: 'NOT FOUND', message: '', data: null })],
    ['an axios error without a response', new AxiosError('network')],
    ['a plain error', new Error('boom')],
    ['a non-error', 'BLOCKED'],
  ])('is false for %s', (_, error) => {
    expect(isBlockedError(error)).toBe(false);
  });
});

describe('isBlockedMember', () => {
  const blocked = (blocker: string) => ({ status: ConversationStatus.BLOCKED, blocker }) as unknown as Conversation;

  it('is true when someone else blocked the conversation', () => {
    expect(isBlockedMember(blocked('them'), 'me')).toBe(true);
  });

  it('is false for the member who did the blocking', () => {
    expect(isBlockedMember(blocked('me'), 'me')).toBe(false);
  });

  it('is false for a conversation that is not blocked, or not loaded yet', () => {
    expect(isBlockedMember({ status: undefined } as unknown as Conversation, 'me')).toBe(false);
    expect(isBlockedMember(undefined, 'me')).toBe(false);
  });
});

describe('isConversationOnline', () => {
  function conversation(...statuses: [string, UserStatus][]) {
    return { members: statuses.map(([id, status]) => ({ id, status })) } as unknown as Conversation;
  }

  it('is online when at least one other member is online', () => {
    expect(isConversationOnline(conversation(['ann', UserStatus.OFFLINE], ['bob', UserStatus.ONLINE]), 'me')).toBe(true);
  });

  it('is offline when every other member is offline', () => {
    expect(isConversationOnline(conversation(['ann', UserStatus.OFFLINE], ['bob', UserStatus.OFFLINE]), 'me')).toBe(false);
  });

  it('ignores the current user', () => {
    expect(isConversationOnline(conversation(['me', UserStatus.ONLINE], ['ann', UserStatus.OFFLINE]), 'me')).toBe(false);
  });
});

describe('getGroupAvatarMembers', () => {
  function conversation(...statuses: [string, UserStatus][]) {
    return { members: statuses.map(([id, status]) => ({ id, status })) } as unknown as Conversation;
  }

  it('shows the first other member who is online and counts the rest', () => {
    const { shown, remainingCount } = getGroupAvatarMembers(
      conversation(['me', UserStatus.ONLINE], ['ann', UserStatus.OFFLINE], ['bob', UserStatus.ONLINE], ['cat', UserStatus.ONLINE]),
      'me',
    );

    expect(shown?.id).toBe('bob');
    expect(remainingCount).toBe(2);
  });

  it('falls back to the first other member when nobody is online', () => {
    const { shown, remainingCount } = getGroupAvatarMembers(
      conversation(['ann', UserStatus.OFFLINE], ['bob', UserStatus.OFFLINE]),
      'me',
    );

    expect(shown?.id).toBe('ann');
    expect(remainingCount).toBe(1);
  });
});

describe('getConversationName', () => {
  const ann = { id: 'ann', displayName: 'Ann' };
  const bob = { id: 'bob', displayName: 'Bob' };
  const me = { id: 'me', displayName: 'Me' };

  function conversation(
    name: string,
    members: { id: string; displayName: string }[],
    nicknames: Conversation['nicknames'] = [],
    isGroupChat = members.length > 2,
  ) {
    return { name, members, nicknames, isGroupChat } as unknown as Conversation;
  }

  it('uses the name when there is one', () => {
    expect(getConversationName(conversation('Team', [ann, bob]), 'me')).toBe('Team');
  });

  it("lists the other members' display names when there is no name", () => {
    expect(getConversationName(conversation('', [me, ann, bob]), 'me')).toBe('Ann, Bob');
  });

  it("prefers a member's nickname over their display name", () => {
    expect(getConversationName(conversation('', [ann, bob], [{ user: 'bob', value: 'Bobby' }]), 'me')).toBe(
      'Ann, Bobby',
    );
  });

  it('shows a group down to one other member as you and them, so it does not look like a direct chat', () => {
    expect(getConversationName(conversation('', [me, bob], [], true), 'me')).toBe('You and Bob');
    expect(getConversationName(conversation('', [me, bob], [{ user: 'bob', value: 'Bobby' }], true), 'me')).toBe(
      'You and Bobby',
    );
  });

  it('keeps just their name for a direct chat', () => {
    expect(getConversationName(conversation('', [me, bob], [], false), 'me')).toBe('Bob');
  });

  it('shows a group where only you are left as only you', () => {
    expect(getConversationName(conversation('', [me], [], true), 'me')).toBe('Only you');
  });

  it('keeps a custom name for a two-member group', () => {
    expect(getConversationName(conversation('Duo', [me, bob], [], true), 'me')).toBe('Duo');
  });
});

describe('getTimeIntervalText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('shows only the time for something sent today', () => {
    const sent = secondsAgo(60);

    expect(getTimeIntervalText(sent)).toBe(time(sent));
  });

  it('says "Yesterday" for something between one and two days old', () => {
    const sent = secondsAgo(SECONDS_IN_DAY + 60);

    expect(getTimeIntervalText(sent)).toBe('Yesterday, ' + time(sent));
  });

  it('shows the weekday within the last week', () => {
    const sent = secondsAgo(SECONDS_IN_DAY * 3);
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(sent);

    expect(getTimeIntervalText(sent)).toBe(`${weekday} ${time(sent)}`);
  });

  it('shows month and day within the last year', () => {
    const sent = secondsAgo(SECONDS_IN_DAY * 30);
    const date = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(sent);

    expect(getTimeIntervalText(sent)).toBe(`${date} ${time(sent)}`);
  });

  it('includes the year for anything older than a year', () => {
    const sent = secondsAgo(SECONDS_IN_DAY * 400);
    const date = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(sent);

    expect(getTimeIntervalText(sent)).toBe(`${date} ${time(sent)}`);
  });

  it('accepts a date string as it arrives from JSON', () => {
    const sent = secondsAgo(60);

    expect(getTimeIntervalText(sent.toISOString() as unknown as Date)).toBe(time(sent));
  });
});

describe('getSecondsInterval', () => {
  it('returns whole seconds regardless of order', () => {
    const a = new Date(0);
    const b = new Date(90_900);

    expect(getSecondsInterval(a, b)).toBe(90);
    expect(getSecondsInterval(b, a)).toBe(90);
  });

  it('is 0 for the same instant', () => {
    expect(getSecondsInterval(NOW, NOW)).toBe(0);
  });
});

describe('emitSocketEventAndWaitForServerReply', () => {
  function socketReplying(reply: unknown) {
    const emitWithAck = vi.fn().mockResolvedValue(reply);
    const timeout = vi.fn(() => ({ emitWithAck }));
    return { socket: { timeout } as unknown as TypedSocket, timeout, emitWithAck };
  }

  it('emits with the reply timeout and resolves with the reply', async () => {
    const { socket, timeout, emitWithAck } = socketReplying({ ok: true });

    await expect(
      emitSocketEventAndWaitForServerReply(socket, 'call:join' as never, { conversationId: 'c' } as never),
    ).resolves.toEqual({ ok: true });

    expect(timeout).toHaveBeenCalledWith(SOCKET_SERVER_REPLY_TIMEOUT_MS);
    expect(emitWithAck).toHaveBeenCalledWith('call:join', { conversationId: 'c' });
  });

  it('throws the server error when the reply carries one', async () => {
    const { socket } = socketReplying({ error: 'conversation not found' });

    await expect(emitSocketEventAndWaitForServerReply(socket, 'call:join' as never, {} as never)).rejects.toThrow(
      'conversation not found',
    );
  });

  it('propagates a timeout', async () => {
    const emitWithAck = vi.fn().mockRejectedValue(new Error('operation has timed out'));
    const socket = { timeout: () => ({ emitWithAck }) } as unknown as TypedSocket;

    await expect(emitSocketEventAndWaitForServerReply(socket, 'call:join' as never, {} as never)).rejects.toThrow(
      'timed out',
    );
  });

  it('resolves a null reply without treating it as an error', async () => {
    const { socket } = socketReplying(null);

    await expect(emitSocketEventAndWaitForServerReply(socket, 'call:leave' as never, {} as never)).resolves.toBeNull();
  });
});

describe('closeSession', () => {
  it('closes both transports', () => {
    const sendTransport = { close: vi.fn() };
    const recvTransport = { close: vi.fn() };

    closeSession({ sendTransport, recvTransport } as unknown as CallSession);

    expect(sendTransport.close).toHaveBeenCalledOnce();
    expect(recvTransport.close).toHaveBeenCalledOnce();
  });
});

describe('getMediaErrorMessage', () => {
  it.each([
    ['NotAllowedError', 'Camera access was blocked'],
    ['NotFoundError', 'No camera or microphone found'],
    ['NotReadableError', 'Camera is being used by another app'],
    ['OverconstrainedError', 'That camera is no longer available'],
  ])('explains a %s', (name, message) => {
    expect(getMediaErrorMessage(new DOMException('', name))).toBe(message);
  });

  it('falls back to a generic message for anything else', () => {
    expect(getMediaErrorMessage(new DOMException('', 'AbortError'))).toBe('Could not start the camera');
    expect(getMediaErrorMessage(new Error('boom'))).toBe('Could not start the camera');
    expect(getMediaErrorMessage('nope')).toBe('Could not start the camera');
  });
});

describe('peopleLabel', () => {
  it('uses the singular for one', () => {
    expect(peopleLabel(1)).toBe('1 person');
  });

  it.each([0, 2, 10])('uses the plural for %i', (count) => {
    expect(peopleLabel(count)).toBe(`${count} people`);
  });
});

describe('getNicknameNoticeText', () => {
  const notice = (user: string, value = 'Ace') => ({ type: MessageNoticeType.NICKNAME, user, value });
  const text = (user: string, actorId: string, value?: string) =>
    getNicknameNoticeText({ notice: notice(user, value), actorId, actorName: 'Ada', targetName: 'Bob', currentUserId: 'me' });

  it.each([
    ['someone else set your nickname', 'me', 'ada', undefined, 'Ada set your nickname to Ace'],
    ["you set someone else's nickname", 'bob', 'me', undefined, "You set Bob's nickname to Ace"],
    ['you set your own nickname', 'me', 'me', undefined, 'You set your nickname to Ace'],
    ['someone set their own nickname', 'ada', 'ada', undefined, 'Ada set their own nickname to Ace'],
    ["someone set a third person's nickname", 'bob', 'ada', undefined, "Ada set Bob's nickname to Ace"],
    ['someone cleared your nickname', 'me', 'ada', '', 'Ada cleared your nickname'],
    ["you cleared someone else's nickname", 'bob', 'me', '', "You cleared Bob's nickname"],
  ])('reads naturally when %s', (_, user, actorId, value, expected) => {
    expect(text(user, actorId, value)).toBe(expected);
  });
});

describe('isSameSender', () => {
  const from = (id: string, notice: object | null = null) => ({ sender: { id }, notice }) as never;

  it('groups consecutive messages from the same person', () => {
    expect(isSameSender(from('a'), from('a'))).toBe(true);
    expect(isSameSender(from('a'), from('b'))).toBe(false);
    expect(isSameSender(undefined, from('a'))).toBe(false);
  });

  it('never groups a message with a notice', () => {
    const notice = from('a', { type: MessageNoticeType.NICKNAME, user: 'b', value: 'x' });

    expect(isSameSender(notice, from('a'))).toBe(false);
    expect(isSameSender(from('a'), notice)).toBe(false);
  });
});

describe('getInitials', () => {
  it('takes the first letters of the first and last word', () => {
    expect(getInitials('Ada Lovelace')).toBe('AL');
    expect(getInitials('w.gayongan')).toBe('WG');
    expect(getInitials('w.gayongan+1')).toBe('W1');
    expect(getInitials('mary jane watson')).toBe('MW');
  });

  it('takes the first two letters of a single word', () => {
    expect(getInitials('tr3onix101')).toBe('TR');
    expect(getInitials('x')).toBe('X');
  });

  it('returns an empty string when there are no letters or digits', () => {
    expect(getInitials('')).toBe('');
    expect(getInitials(' .+ ')).toBe('');
  });

  it('keeps non-latin letters whole', () => {
    expect(getInitials('élise ñuñez')).toBe('ÉÑ');
  });
});

describe('getAvatarColor', () => {
  it('always gives the same key the same palette color', () => {
    expect(getAvatarColor('user-1')).toBe(getAvatarColor('user-1'));
    expect(AVATAR_FALLBACK_COLORS).toContain(getAvatarColor('user-1'));
  });

  it('spreads different keys across the palette', () => {
    const colors = new Set(Array.from({ length: 50 }, (_, index) => getAvatarColor(`user-${index}`)));
    expect(colors.size).toBeGreaterThan(1);
  });
});

describe('call notices', () => {
  const ring = { type: MessageNoticeType.CALL_RING, user: 'ada', value: '' };

  it('tells call notices apart from nickname notices', () => {
    expect(isCallNotice(ring)).toBe(true);
    expect(isCallNotice({ type: MessageNoticeType.CALL_STARTED, user: 'ada', value: '' })).toBe(true);
    expect(isCallNotice({ type: MessageNoticeType.CALL_ENDED, user: 'ada', value: '30' })).toBe(true);
    expect(isCallNotice({ type: MessageNoticeType.NICKNAME, user: 'ada', value: 'Ace' })).toBe(false);
  });

  it.each([
    [0, '0:00'],
    [7, '0:07'],
    [95, '1:35'],
    [3600, '1:00:00'],
    [3725, '1:02:05'],
  ])('formats %i seconds as %s', (seconds, text) => {
    expect(formatCallDuration(seconds)).toBe(text);
  });

  it('names who started a call, or says you did', () => {
    expect(getCallNoticeText({ notice: ring, actorId: 'ada', actorName: 'Ada', currentUserId: 'me' })).toBe(
      'Ada started a call',
    );
    expect(getCallNoticeText({ notice: ring, actorId: 'me', actorName: 'Me', currentUserId: 'me' })).toBe(
      'You started a call',
    );
  });

  it('says the call started, and when it ended how long it lasted', () => {
    const input = { actorId: 'ada', actorName: 'Ada', currentUserId: 'me' };

    expect(getCallNoticeText({ ...input, notice: { type: MessageNoticeType.CALL_STARTED, user: 'ada', value: '' } })).toBe(
      'Call started',
    );
    expect(getCallNoticeText({ ...input, notice: { type: MessageNoticeType.CALL_ENDED, user: 'ada', value: '95' } })).toBe(
      'Call ended · 1:35',
    );
    expect(getCallNoticeText({ ...input, notice: { type: MessageNoticeType.CALL_ENDED, user: 'ada', value: '0' } })).toBe(
      'Call ended',
    );
  });

  it('picks the right sentence for any notice', () => {
    const input = { actorId: 'ada', actorName: 'Ada', targetName: 'Bob', currentUserId: 'me' };

    expect(getNoticeText({ ...input, notice: ring })).toBe('Ada started a call');
    expect(getNoticeText({ ...input, notice: { type: MessageNoticeType.NICKNAME, user: 'bob', value: 'Ace' } })).toBe(
      "Ada set Bob's nickname to Ace",
    );
  });
});
