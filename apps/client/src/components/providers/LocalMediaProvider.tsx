'use client';
import useLocalMediaStream, { useCameraDevices } from '@/components/hooks/useLocalMediaStream';
import { LocalMediaContextType } from '@/types/call.types';
import React, { createContext, useContext, useState } from 'react';

const LocalMediaContext = createContext<LocalMediaContextType | null>(null);

export function useLocalMedia() {
  const localMediaContext = useContext(LocalMediaContext);
  if (!localMediaContext) throw new Error('useLocalMedia must be used inside <LocalMediaProvider>');
  return localMediaContext;
}

export default function LocalMediaProvider({ children }: { children: React.ReactNode }) {
  const [selectedCameraId, setSelectedCameraId] = useState<string>();
  const [isCameraOn, setIsCameraOn] = useState(true);
  const localMedia = useLocalMediaStream({ cameraDeviceId: selectedCameraId, video: isCameraOn });
  const cameras = useCameraDevices(localMedia.stream);
  const activeCameraId = selectedCameraId ?? localMedia.stream?.getVideoTracks()[0]?.getSettings().deviceId;

  function toggleCamera() {
    if (isCameraOn && activeCameraId) setSelectedCameraId(activeCameraId);
    setIsCameraOn((wasOn) => !wasOn);
  }

  return (
    <LocalMediaContext.Provider
      value={{ localMedia, cameras, activeCameraId, selectCamera: setSelectedCameraId, isCameraOn, toggleCamera }}
    >
      {children}
    </LocalMediaContext.Provider>
  );
}
