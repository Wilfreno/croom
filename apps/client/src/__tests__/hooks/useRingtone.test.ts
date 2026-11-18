import useRingtone from '@/components/hooks/useRingtone';
import type { Ringtone } from '@/types/call.types';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type FakeOscillator = { frequency: { value: number }; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> };

let contexts: FakeAudioContext[];

class FakeAudioContext {
  currentTime = 10;
  destination = {};
  oscillators: FakeOscillator[] = [];
  gains: { gain: { value: number } }[] = [];
  close = vi.fn(async () => undefined);

  constructor() {
    contexts.push(this);
  }

  createGain() {
    const gainNode = {
      gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
    this.gains.push(gainNode);
    return gainNode;
  }

  createOscillator() {
    const oscillator = { frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
    this.oscillators.push(oscillator);
    return oscillator;
  }
}

const ringtone: Ringtone = {
  volume: 0.2,
  cycleSeconds: 3,
  notes: [
    { startSeconds: 0, durationSeconds: 1, frequencies: [440, 480] },
    { startSeconds: 1.5, durationSeconds: 0.5, frequencies: [880] },
  ],
};

beforeEach(() => {
  contexts = [];
  vi.useFakeTimers();
  vi.stubGlobal('AudioContext', FakeAudioContext);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useRingtone', () => {
  it('stays silent while not playing', () => {
    renderHook(() => useRingtone(ringtone, false));

    expect(contexts).toHaveLength(0);
  });

  it('plays every note of a cycle at its frequencies, times and volume', () => {
    renderHook(() => useRingtone(ringtone, true));

    const [context] = contexts;
    expect(context.gains[0].gain.value).toBe(0.2);
    expect(context.oscillators.map((oscillator) => oscillator.frequency.value)).toEqual([440, 480, 880]);
    expect(context.oscillators[0].start).toHaveBeenCalledWith(10);
    expect(context.oscillators[0].stop).toHaveBeenCalledWith(11);
    expect(context.oscillators[2].start).toHaveBeenCalledWith(11.5);
    expect(context.oscillators[2].stop).toHaveBeenCalledWith(12);
  });

  it('repeats the cycle until it stops, then closes the audio', () => {
    const { rerender } = renderHook(({ isPlaying }) => useRingtone(ringtone, isPlaying), {
      initialProps: { isPlaying: true },
    });
    const [context] = contexts;

    vi.advanceTimersByTime(3000);
    expect(context.oscillators).toHaveLength(6);

    rerender({ isPlaying: false });
    expect(context.close).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(6000);
    expect(context.oscillators).toHaveLength(6);
  });

  it('closes the audio on unmount', () => {
    const { unmount } = renderHook(() => useRingtone(ringtone, true));

    unmount();

    expect(contexts[0].close).toHaveBeenCalledOnce();
  });

  it('does nothing in a browser without Web Audio', () => {
    vi.stubGlobal('AudioContext', undefined);

    expect(() => renderHook(() => useRingtone(ringtone, true))).not.toThrow();
  });
});
