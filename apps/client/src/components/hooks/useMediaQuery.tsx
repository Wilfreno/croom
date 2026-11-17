'use client';
import { useSyncExternalStore } from 'react';

export default function useMediaQuery(query: string) {
  function subscribe(onChange: () => void) {
    if (typeof window.matchMedia !== 'function') return () => {};
    const mediaQueryList = window.matchMedia(query);
    mediaQueryList.addEventListener('change', onChange);
    return () => mediaQueryList.removeEventListener('change', onChange);
  }

  function getSnapshot() {
    if (typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(query).matches;
  }

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
