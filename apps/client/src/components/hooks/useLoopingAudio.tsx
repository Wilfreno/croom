'use client';
import { useEffect } from 'react';

export default function useLoopingAudio(src: string, volume: number, isPlaying: boolean) {
  useEffect(() => {
    if (!isPlaying || typeof window.Audio !== 'function') return;

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    audio.play()?.catch(() => {});

    return () => audio.pause();
  }, [src, volume, isPlaying]);
}
