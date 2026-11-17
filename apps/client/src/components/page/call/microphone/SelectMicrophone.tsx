'use client';
import { useLocalMedia } from '@/components/providers/LocalMediaProvider';
import SelectDevice from '../SelectDevice';

export default function SelectMicrophone() {
  const { microphones, activeMicrophoneId, selectMicrophone } = useLocalMedia();

  return (
    <SelectDevice
      label="Microphone"
      devices={microphones}
      activeDeviceId={activeMicrophoneId}
      onSelect={selectMicrophone}
    />
  );
}
