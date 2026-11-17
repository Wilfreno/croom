'use client';
import { useLocalMedia } from '@/components/providers/LocalMediaProvider';
import { Mic, MicOff } from 'lucide-react';
import CallControlButton from '../CallControlButton';

export default function ToggleMicrophone() {
  const { isMicOn, toggleMic } = useLocalMedia();

  return (
    <CallControlButton
      label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
      tone={isMicOn ? 'neutral' : 'off'}
      aria-pressed={!isMicOn}
      onClick={toggleMic}
    >
      {isMicOn ? <Mic /> : <MicOff />}
    </CallControlButton>
  );
}
