import {
  closeSession,
  cn,
  emitSocketEventAndWaitForServerReply,
  getMediaErrorMessage,
  getSecondsInterval,
  getTimeIntervalText,
  isGroupChat,
  peopleLabel,
} from '@/lib/utils';
import type { CallSession } from '@/types/call.types';
import type { TypedSocket } from '@/types/socket.types';
import { SECONDS_IN_DAY, SOCKET_SERVER_REPLY_TIMEOUT_MS } from '@repo/constants';
import type { Conversation } from '@repo/types';
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

describe('isGroupChat', () => {
  const conversation = (members: number) =>
    ({ members: Array.from({ length: members }, (_, i) => ({ id: String(i) })) }) as unknown as Conversation;

  it('is false for a one-to-one conversation (the other member only)', () => {
    expect(isGroupChat(conversation(1))).toBe(false);
  });

  it('is true for two or more other members', () => {
    expect(isGroupChat(conversation(2))).toBe(true);
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
