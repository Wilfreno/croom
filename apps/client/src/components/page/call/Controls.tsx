'use client';
import { useCall } from '@/components/providers/CallProvider';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Phone } from 'lucide-react';
import CameraControl from './camera/CameraControls';
import ParticipantsButton from './ParticipantsButton';

export default function Controls() {
  const { isMicOn, toggleMic, leave } = useCall();

  return (
    <section className="bg-white/20 backdrop-blur-sm absolute bottom-10 right-1/2 translate-x-1/2 border border-muted rounded-full flex items-center  gap-20 p-2">
      <div className="flex items-center gap-10">
        <Button
          onClick={toggleMic}
          variant={isMicOn ? 'outline' : 'destructive'}
          className="rounded-full"
          aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
          aria-pressed={!isMicOn}
        >
          {isMicOn ? <Mic /> : <MicOff />}
        </Button>
        <CameraControl />
        <ParticipantsButton />
      </div>
      <Button variant="destructive" className="rounded-full" aria-label="Leave call" onClick={leave}>
        <Phone />
      </Button>
    </section>
  );
}
