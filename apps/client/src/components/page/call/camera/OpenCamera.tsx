'use client';
import { useLocalMedia } from '@/components/providers/LocalMediaProvider';
import { Button } from '@/components/ui/button';
import { Video, VideoOff } from 'lucide-react';

export default function OpenCamera() {
  const { isCameraOn, toggleCamera } = useLocalMedia();

  return (
    <Button
      onClick={toggleCamera}
      variant={isCameraOn ? 'default' : 'destructive'}
      className="rounded-full"
      aria-label={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
      aria-pressed={!isCameraOn}
    >
      {isCameraOn ? <Video /> : <VideoOff />}
    </Button>
  );
}
