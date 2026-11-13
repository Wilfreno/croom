import useDebounce from '@/components/hooks/useDebounce';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is undefined until the delay has passed', () => {
    const { result } = renderHook(() => useDebounce('a'));

    expect(result.current).toBeUndefined();

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('a');
  });

  it('only settles on the last value of a quick burst', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });

    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'ab' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'abc' });
    act(() => vi.advanceTimersByTime(299));

    expect(result.current).toBeUndefined();

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('abc');
  });

  it('honours a custom delay', () => {
    const { result } = renderHook(() => useDebounce(1, 1000));

    act(() => vi.advanceTimersByTime(999));
    expect(result.current).toBeUndefined();

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(1);
  });

  it('does not update after unmounting', () => {
    const { result, unmount } = renderHook(() => useDebounce('a'));

    unmount();
    act(() => vi.advanceTimersByTime(300));

    expect(result.current).toBeUndefined();
  });
});
