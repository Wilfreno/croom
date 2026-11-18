import useLoopingAudio from '@/components/hooks/useLoopingAudio';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let players: FakeAudio[];

class FakeAudio {
  loop = false;
  volume = 1;
  play = vi.fn(async () => undefined);
  pause = vi.fn();

  constructor(public src: string) {
    players.push(this);
  }
}

beforeEach(() => {
  players = [];
  vi.stubGlobal('Audio', FakeAudio);
});
afterEach(() => vi.unstubAllGlobals());

describe('useLoopingAudio', () => {
  it('stays silent while not playing', () => {
    renderHook(() => useLoopingAudio('/sounds/ring.mp3', 0.5, false));

    expect(players).toHaveLength(0);
  });

  it('loops the sound at the given volume', () => {
    renderHook(() => useLoopingAudio('/sounds/ring.mp3', 0.5, true));

    const [player] = players;
    expect(player.src).toBe('/sounds/ring.mp3');
    expect(player.loop).toBe(true);
    expect(player.volume).toBe(0.5);
    expect(player.play).toHaveBeenCalledOnce();
  });

  it('stops when told to and on unmount', () => {
    const { rerender, unmount } = renderHook(({ isPlaying }) => useLoopingAudio('/sounds/ring.mp3', 1, isPlaying), {
      initialProps: { isPlaying: true },
    });

    rerender({ isPlaying: false });
    expect(players[0].pause).toHaveBeenCalledOnce();

    rerender({ isPlaying: true });
    unmount();
    expect(players[1].pause).toHaveBeenCalledOnce();
  });

  it('stays quiet without an error when the browser blocks playback', async () => {
    class BlockedAudio extends FakeAudio {
      play = vi.fn(() => Promise.reject(new DOMException('blocked', 'NotAllowedError')));
    }
    vi.stubGlobal('Audio', BlockedAudio);

    expect(() => renderHook(() => useLoopingAudio('/sounds/ring.mp3', 1, true))).not.toThrow();
    await Promise.resolve();
  });
});
