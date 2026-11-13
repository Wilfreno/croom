import useURLSearchParams from '@/components/hooks/useURLSearchParams';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({ useSearchParams: () => searchParams }));

describe('useURLSearchParams', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('reads the query string of the current URL', () => {
    window.history.replaceState(null, '', '/conversation?tab=media&q=hi');

    const { result } = renderHook(() => useURLSearchParams());

    expect(result.current.urlSearchParams.get('tab')).toBe('media');
    expect(result.current.urlSearchParams.get('q')).toBe('hi');
  });

  it('is empty without a query string', () => {
    const { result } = renderHook(() => useURLSearchParams());

    expect([...result.current.urlSearchParams]).toEqual([]);
  });

  it('re-reads the URL when Next reports new search params', () => {
    const { result, rerender } = renderHook(() => useURLSearchParams());

    window.history.replaceState(null, '', '/?step=2');
    searchParams = new URLSearchParams('step=2');
    rerender();

    expect(result.current.urlSearchParams.get('step')).toBe('2');
  });
});
