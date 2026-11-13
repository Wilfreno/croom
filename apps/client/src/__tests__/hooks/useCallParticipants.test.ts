import { mockStream, mockTrack } from '@/__tests__/mocks/mock-media';
import useCallParticipants, { useIsSelfInGrid, useSelfParticipant } from '@/components/hooks/useCallParticipants';
import type { CallContextType, CallParticipant, LocalMediaContextType } from '@/types/call.types';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const videoTrack = mockTrack('video');

let call: CallContextType;
let localMedia: LocalMediaContextType;
let session: { user: { id: string; photo: { url: string } | null } | null };
let searchParams: URLSearchParams;

vi.mock('@/components/providers/CallProvider', () => ({ useCall: () => call }));
vi.mock('@/components/providers/LocalMediaProvider', () => ({ useLocalMedia: () => localMedia }));
vi.mock('@/components/providers/AuthProvider', () => ({ useAuth: () => ({ session }) }));
vi.mock('next/navigation', () => ({ useSearchParams: () => searchParams }));

function participant(peerId: string): CallParticipant {
  return { peerId, userId: peerId, audioTrack: null, videoTrack: null, isAudioPaused: false, isVideoPaused: false };
}

beforeEach(() => {
  call = {
    status: 'connected',
    error: null,
    members: new Map(),
    participants: [],
    isMicOn: true,
    toggleMic: vi.fn(),
    leave: vi.fn(),
  };
  localMedia = {
    localMedia: { status: 'ready', stream: mockStream([videoTrack]), error: null },
    cameras: [],
    selectCamera: vi.fn(),
    isCameraOn: true,
    toggleCamera: vi.fn(),
  };
  session = { user: { id: 'me', photo: { url: 'https://utfs.io/me' } } };
  searchParams = new URLSearchParams();
});

afterEach(() => vi.unstubAllEnvs());

describe('useCallParticipants', () => {
  it("returns the call's real participants", () => {
    call.participants = [participant('a')];

    const { result } = renderHook(() => useCallParticipants());

    expect(result.current).toEqual({
      status: 'connected',
      error: null,
      participants: call.participants,
      members: call.members,
    });
  });

  it('ignores ?preview outside development', () => {
    vi.stubEnv('NODE_ENV', 'production');
    searchParams = new URLSearchParams('preview=3');

    expect(renderHook(() => useCallParticipants()).result.current.participants).toEqual([]);
  });

  describe('in development with ?preview=N', () => {
    beforeEach(() => vi.stubEnv('NODE_ENV', 'development'));

    it('fills the call with N fake participants using your camera', () => {
      searchParams = new URLSearchParams('preview=4');

      const { result } = renderHook(() => useCallParticipants());

      expect(result.current.status).toBe('connected');
      expect(result.current.participants).toHaveLength(4);
      expect(result.current.members.get('preview-1')?.displayName).toBe('Preview user 1');
      expect(result.current.participants.every((p) => p.videoTrack === videoTrack && p.audioTrack === null)).toBe(true);
    });

    it('shows camera-off on every third and muted on every fourth', () => {
      searchParams = new URLSearchParams('preview=4');

      const { participants } = renderHook(() => useCallParticipants()).result.current;

      expect(participants.map((p) => p.isVideoPaused)).toEqual([false, false, true, false]);
      expect(participants.map((p) => p.isAudioPaused)).toEqual([false, false, false, true]);
    });

    it('shows every preview camera off when your camera is off', () => {
      searchParams = new URLSearchParams('preview=2');
      localMedia.isCameraOn = false;

      const { participants } = renderHook(() => useCallParticipants()).result.current;

      expect(participants.every((p) => p.isVideoPaused)).toBe(true);
    });

    it.each(['0', '-1', '1.5', 'abc'])('ignores preview=%s', (value) => {
      searchParams = new URLSearchParams(`preview=${value}`);

      expect(renderHook(() => useCallParticipants()).result.current.participants).toEqual([]);
    });
  });
});

describe('useIsSelfInGrid', () => {
  it('keeps you in the floating tile for a one-to-one call', () => {
    call.participants = [participant('a')];

    expect(renderHook(() => useIsSelfInGrid()).result.current).toBe(false);
  });

  it('moves you into the grid once a third person joins', () => {
    call.participants = [participant('a'), participant('b')];

    expect(renderHook(() => useIsSelfInGrid()).result.current).toBe(true);
  });
});

describe('useSelfParticipant', () => {
  it('describes you with your camera and never your own audio', () => {
    const { result } = renderHook(() => useSelfParticipant());

    expect(result.current).toEqual({
      participant: {
        peerId: 'self',
        userId: 'me',
        audioTrack: null,
        videoTrack,
        isAudioPaused: false,
        isVideoPaused: false,
      },
      member: { id: 'me', displayName: 'You', photoUrl: 'https://utfs.io/me' },
    });
  });

  it('reflects a muted microphone and a camera that is off', () => {
    call.isMicOn = false;
    localMedia.isCameraOn = false;

    const { participant } = renderHook(() => useSelfParticipant()).result.current;

    expect(participant.isAudioPaused).toBe(true);
    expect(participant.isVideoPaused).toBe(true);
  });

  it('copes with no stream and no session yet', () => {
    localMedia.localMedia = { status: 'loading', stream: null, error: null };
    session = { user: null };

    const { participant, member } = renderHook(() => useSelfParticipant()).result.current;

    expect(participant.videoTrack).toBeNull();
    expect(member).toEqual({ id: 'self', displayName: 'You', photoUrl: null });
  });
});
