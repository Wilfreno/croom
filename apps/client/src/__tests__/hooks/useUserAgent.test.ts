import useUserAgent from '@/components/hooks/useUserAgent';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const DESKTOP_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0';
const PHONE_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148';

function setUserAgent(userAgent: string) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
}

function setWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true });
}

describe('useUserAgent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setWidth(1024);
  });

  it('reports a phone user agent as mobile', () => {
    setUserAgent(PHONE_AGENT);
    setWidth(1024);

    expect(renderHook(() => useUserAgent()).result.current.onMobile).toBe(true);
  });

  it('reports a wide desktop window as not mobile', () => {
    setUserAgent(DESKTOP_AGENT);
    setWidth(1024);

    expect(renderHook(() => useUserAgent()).result.current.onMobile).toBe(false);
  });

  it('reports a narrow desktop window as mobile', () => {
    setUserAgent(DESKTOP_AGENT);
    setWidth(500);

    expect(renderHook(() => useUserAgent()).result.current.onMobile).toBe(true);
  });

  it('follows the window as it is resized across 768px', () => {
    setUserAgent(DESKTOP_AGENT);
    setWidth(1024);
    const { result } = renderHook(() => useUserAgent());

    act(() => {
      setWidth(767);
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.onMobile).toBe(true);

    act(() => {
      setWidth(768);
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.onMobile).toBe(false);
  });

  it('stops listening for resizes once unmounted', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useUserAgent());

    unmount();

    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
