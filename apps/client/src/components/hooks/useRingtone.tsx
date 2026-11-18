'use client';
import { Ringtone, RingtoneNote } from '@/types/call.types';
import { RINGTONE_FADE_SECONDS } from '@repo/constants';
import { useEffect } from 'react';

function playNote(context: AudioContext, output: AudioNode, note: RingtoneNote, cycleStartTime: number) {
  const startTime = cycleStartTime + note.startSeconds;
  const endTime = startTime + note.durationSeconds;
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0, startTime);
  envelope.gain.linearRampToValueAtTime(1, startTime + RINGTONE_FADE_SECONDS);
  envelope.gain.setValueAtTime(1, endTime - RINGTONE_FADE_SECONDS);
  envelope.gain.linearRampToValueAtTime(0, endTime);
  envelope.connect(output);

  for (const frequency of note.frequencies) {
    const oscillator = context.createOscillator();
    oscillator.frequency.value = frequency;
    oscillator.connect(envelope);
    oscillator.start(startTime);
    oscillator.stop(endTime);
  }
}

export default function useRingtone(ringtone: Ringtone, isPlaying: boolean) {
  useEffect(() => {
    if (!isPlaying || typeof window.AudioContext !== 'function') return;

    const context = new AudioContext();
    const output = context.createGain();
    output.gain.value = ringtone.volume;
    output.connect(context.destination);

    function playCycle() {
      const cycleStartTime = context.currentTime;
      for (const note of ringtone.notes) playNote(context, output, note, cycleStartTime);
    }

    playCycle();
    const cycleIntervalId = setInterval(playCycle, ringtone.cycleSeconds * 1000);

    return () => {
      clearInterval(cycleIntervalId);
      context.close();
    };
  }, [ringtone, isPlaying]);
}
