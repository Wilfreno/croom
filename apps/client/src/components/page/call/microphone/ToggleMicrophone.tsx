'use client';
import { useCall } from '@/components/providers/CallProvider';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';

export default function ToggleMicrophone() {
  const { isMicOn, toggleMic } = useCall();

  return (
    <Button
      onClick={toggleMic}
      variant={isMicOn ? 'default' : 'destructive'}
      className="rounded-full"
      aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
      aria-pressed={!isMicOn}
    >
      {isMicOn ? <Mic /> : <MicOff />}
    </Button>
  );
}
