import { mockStream } from '@/__tests__/mocks/mock-media';
import useMediasoupCall from '@/components/hooks/useMediasoupCall';
import CallProvider, { useCall } from '@/components/providers/CallProvider';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const stream = mockStream();
const socket = { id: 'socket' };
const push = vi.fn();
const toggleMic = vi.fn();

vi.mock('@/components/hooks/useMediasoupCall', () => ({ default: vi.fn() }));
vi.mock('@/components/providers/SocketIOProvider', () => ({ useSocketIO: () => socket }));
vi.mock('@/components/providers/LocalMediaProvider', () => ({
  useLocalMedia: () => ({ localMedia: { status: 'ready', stream, error: null }, isCameraOn: false }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

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
    isMicOn: true,
    toggleMic,
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
    });
  });

  it('exposes the call state', () => {
    const { result } = renderHook(() => useCall(), { wrapper });

    expect(result.current).toMatchObject({ status: 'connected', isMicOn: true, toggleMic });
  });

  it('leaves by going back to the conversation', () => {
    const { result } = renderHook(() => useCall(), { wrapper });

    result.current.leave();

    expect(push).toHaveBeenCalledWith('/conversation/c1');
  });
});
