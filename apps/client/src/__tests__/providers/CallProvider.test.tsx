import { mockStream } from '@/__tests__/mocks/mock-media';
import { mockSocket } from '@/__tests__/mocks/mock-socket';
import useMediasoupCall from '@/components/hooks/useMediasoupCall';
import CallProvider, { useCall } from '@/components/providers/CallProvider';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const stream = mockStream();
const server = mockSocket();
const socket = server.socket;
const push = vi.fn();

vi.mock('@/components/hooks/useMediasoupCall', () => ({ default: vi.fn() }));
vi.mock('@/components/providers/SocketIOProvider', () => ({ useSocketIO: () => socket }));
vi.mock('@/components/providers/LocalMediaProvider', () => ({
  useLocalMedia: () => ({ localMedia: { status: 'ready', stream, error: null }, isCameraOn: false, isMicOn: true }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('sonner', () => ({ toast: vi.fn() }));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CallProvider conversationId="c1">{children}</CallProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useMediasoupCall).mockReturnValue({
    status: 'connected',
    error: null,
    members: new Map(),
    participants: [],
  });
});

describe('useCall', () => {
  it('throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useCall())).toThrow('useCall must be used inside <CallProvider>');
  });
});

describe('CallProvider', () => {
  it('joins the call with the socket, the conversation and your local media', () => {
    renderHook(() => useCall(), { wrapper });

    expect(useMediasoupCall).toHaveBeenCalledWith({
      socket,
      conversationId: 'c1',
      localStream: stream,
      isCameraOn: false,
      isMicOn: true,
    });
  });

  it('exposes the call state', () => {
    const { result } = renderHook(() => useCall(), { wrapper });

    expect(result.current).toMatchObject({ status: 'connected' });
  });

  it('leaves by going back to the conversation', () => {
    const { result } = renderHook(() => useCall(), { wrapper });

    result.current.leave();

    expect(push).toHaveBeenCalledWith('/conversation/c1');
  });

  it('sends you back to the conversation, saying why, when the call is ended for you', () => {
    renderHook(() => useCall(), { wrapper });

    act(() => server.serverEmit('CALL_ENDED', { reason: 'Alice ended the call' }));

    expect(toast).toHaveBeenCalledWith('Alice ended the call');
    expect(push).toHaveBeenCalledWith('/conversation/c1');
  });

  it('stops listening once you leave the call page', () => {
    const { unmount } = renderHook(() => useCall(), { wrapper });

    unmount();

    expect(server.listenerCount('CALL_ENDED')).toBe(0);
  });
});
