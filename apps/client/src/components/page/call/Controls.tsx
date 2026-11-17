'use client';
import { useCall } from '@/components/providers/CallProvider';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import CameraControl from './camera/CameraControls';
import MicrophoneControl from './microphone/MicrophoneControls';

export default function Controls() {
  const { leave } = useCall();

  return (
    <section className="bg-white/20 backdrop-blur-sm absolute bottom-6 sm:bottom-10 right-1/2 translate-x-1/2 border border-muted rounded-full flex items-center gap-8 sm:gap-20 p-2">
      <div className="flex items-center gap-4 sm:gap-10">
        <MicrophoneControl />
        <CameraControl />
      </div>
      <Button variant="destructive" className="rounded-full" aria-label="Leave call" onClick={leave}>
        <Phone />
      </Button>
    </section>
  );
}
