import type { TypedSocket } from '@/types/socket.types';
import { vi } from 'vitest';

type Handler = (...args: never[]) => void;
type Reply = unknown | ((payload: unknown) => unknown);

/**
 * A stand-in for a socket.io client socket.
 *
 * - `on`/`off` register listeners; `serverEmit(event, payload)` fires them like the server would.
 * - `timeout(ms).emitWithAck(event, payload)` answers from `replies`: a value, or a function of the payload.
 *   An event with no reply rejects, the way a timed-out acknowledgement does.
 * - `emit` is a spy for fire-and-forget events.
 */
export function mockSocket(replies: Record<string, Reply> = {}) {
  const listeners = new Map<string, Set<Handler>>();

  const emitWithAck = vi.fn(async (event: string, payload: unknown) => {
    if (!(event in replies)) throw new Error(`operation has timed out (${event})`);
    const reply = replies[event];
    return typeof reply === 'function' ? await (reply as (payload: unknown) => unknown)(payload) : reply;
  });

  const socket = {
    id: 'socket-1',
    connected: true,
    on: vi.fn((event: string, handler: Handler) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler);
      return socket;
    }),
    off: vi.fn((event: string, handler?: Handler) => {
      if (handler) listeners.get(event)?.delete(handler);
      else listeners.delete(event);
      return socket;
    }),
    emit: vi.fn(),
    timeout: vi.fn(() => ({ emitWithAck })),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(() => listeners.clear()),
  };

  return {
    socket: socket as unknown as TypedSocket,
    spies: socket,
    emitWithAck,
    replies,
    /** Fires every listener registered for `event`, as an incoming server event. */
    serverEmit(event: string, ...args: unknown[]) {
      listeners.get(event)?.forEach((handler) => (handler as (...a: unknown[]) => void)(...args));
    },
    listenerCount(event: string) {
      return listeners.get(event)?.size ?? 0;
    },
  };
}
