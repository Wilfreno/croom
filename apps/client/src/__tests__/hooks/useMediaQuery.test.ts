import useMediaQuery from '@/components/hooks/useMediaQuery';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

function stubMatchMedia(initialMatches: boolean) {
  const listeners = new Set<() => void>();
  const state = { matches: initialMatches };
  const mediaQueryList = {
    get matches() {
      return state.matches;
    },
    addEventListener: vi.fn((_: string, listener: () => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_: string, listener: () => void) => listeners.delete(listener)),
  };
  const matchMedia = vi.fn(() => mediaQueryList);
  vi.stubGlobal('matchMedia', matchMedia);

  return {
    matchMedia,
    mediaQueryList,
    change(matches: boolean) {
      state.matches = matches;
      listeners.forEach((listener) => listener());
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('useMediaQuery', () => {
  it('reports whether the query matches right now', () => {
    const media = stubMatchMedia(true);

    const { result } = renderHook(() => useMediaQuery('(min-width: 640px)'));

    expect(result.current).toBe(true);
    expect(media.matchMedia).toHaveBeenCalledWith('(min-width: 640px)');
  });

  it('follows the query as it starts and stops matching', () => {
    const media = stubMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(min-width: 640px)'));
    expect(result.current).toBe(false);

    act(() => media.change(true));
    expect(result.current).toBe(true);

    act(() => media.change(false));
    expect(result.current).toBe(false);
  });

  it('stops listening once unmounted', () => {
    const media = stubMatchMedia(false);
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 640px)'));

    unmount();

    expect(media.mediaQueryList.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('never matches in a browser without media queries', () => {
    vi.stubGlobal('matchMedia', undefined);

    const { result } = renderHook(() => useMediaQuery('(min-width: 640px)'));

    expect(result.current).toBe(false);
  });
});
