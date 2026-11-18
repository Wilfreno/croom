'use client';
import { useLocalMedia } from '@/components/providers/LocalMediaProvider';
import SelectDevice from '../SelectDevice';

export default function SelectCamera() {
  const { cameras, activeCameraId, selectCamera } = useLocalMedia();

  return <SelectDevice label="Camera" devices={cameras} activeDeviceId={activeCameraId} onSelect={selectCamera} />;
}
