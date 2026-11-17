'use client';
import { useCall } from '@/components/providers/CallProvider';
import { PhoneOff } from 'lucide-react';
import CallControlButton from './CallControlButton';
import CameraControl from './camera/CameraControls';
import MicrophoneControl from './microphone/MicrophoneControls';

export default function Controls() {
  const { leave } = useCall();

  return (
    <section
      aria-label="Call controls"
      className="absolute bottom-6 right-1/2 flex translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 p-2 shadow-lg backdrop-blur-md sm:bottom-10 sm:gap-3"
    >
      <MicrophoneControl />
      <CameraControl />
      <div aria-hidden className="mx-1 h-8 w-px bg-white/15" />
      <CallControlButton label="Leave call" tone="danger" onClick={leave}>
        <PhoneOff />
      </CallControlButton>
    </section>
  );
}
