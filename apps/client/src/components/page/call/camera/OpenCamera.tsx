'use client';
import { useLocalMedia } from '@/components/providers/LocalMediaProvider';
import { Video, VideoOff } from 'lucide-react';
import CallControlButton from '../CallControlButton';

export default function OpenCamera() {
  const { isCameraOn, toggleCamera } = useLocalMedia();

  return (
    <CallControlButton
      label={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
      tone={isCameraOn ? 'neutral' : 'off'}
      aria-pressed={!isCameraOn}
      onClick={toggleCamera}
    >
      {isCameraOn ? <Video /> : <VideoOff />}
    </CallControlButton>
  );
}
