'use client';
import { playRingtoneNote } from '@/lib/utils';
import { Ringtone } from '@/types/call.types';
import { useEffect } from 'react';

export default function useRingtone(ringtone: Ringtone, isPlaying: boolean) {
  useEffect(() => {
    if (!isPlaying || typeof window.AudioContext !== 'function') return;

    const context = new AudioContext();
    const output = context.createGain();
    output.gain.value = ringtone.volume;
    output.connect(context.destination);

    function playCycle() {
      const cycleStartTime = context.currentTime;
      for (const note of ringtone.notes) playRingtoneNote(context, output, note, cycleStartTime);
    }

    playCycle();
    const cycleIntervalId = setInterval(playCycle, ringtone.cycleSeconds * 1000);

    return () => {
      clearInterval(cycleIntervalId);
      context.close();
    };
  }, [ringtone, isPlaying]);
}
