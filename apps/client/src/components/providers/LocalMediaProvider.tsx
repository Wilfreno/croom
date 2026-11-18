'use client';
import useLocalMediaStream, { useMediaDevices } from '@/components/hooks/useLocalMediaStream';
import { readCallMediaPreferences, saveCallMediaPreferences } from '@/lib/utils';
import { CallMediaPreferences, LocalMediaContextType } from '@/types/call.types';
import { CALL_DEFAULT_MEDIA_PREFERENCES } from '@repo/constants';
import React, { createContext, useContext, useEffect, useState } from 'react';

const LocalMediaContext = createContext<LocalMediaContextType | null>(null);

export function useLocalMedia() {
  const localMediaContext = useContext(LocalMediaContext);
  if (!localMediaContext) throw new Error('useLocalMedia must be used inside <LocalMediaProvider>');
  return localMediaContext;
}

export default function LocalMediaProvider({ children }: { children: React.ReactNode }) {
  const [savedPreferences, setSavedPreferences] = useState<CallMediaPreferences | null>(null);
  const preferences: CallMediaPreferences = savedPreferences ?? CALL_DEFAULT_MEDIA_PREFERENCES;
  const { cameraId, microphoneId, isCameraOn, isMicOn } = preferences;

  useEffect(() => {
    setSavedPreferences(readCallMediaPreferences());
  }, []);

  const localMedia = useLocalMediaStream({
    cameraDeviceId: cameraId,
    microphoneDeviceId: microphoneId,
    video: isCameraOn,
    enabled: savedPreferences !== null,
  });
  const cameras = useMediaDevices('videoinput', localMedia.stream);
  const microphones = useMediaDevices('audioinput', localMedia.stream);
  const activeCameraId = cameraId ?? localMedia.stream?.getVideoTracks()[0]?.getSettings().deviceId;
  const activeMicrophoneId = microphoneId ?? localMedia.stream?.getAudioTracks()[0]?.getSettings().deviceId;

  function updatePreferences(changes: Partial<CallMediaPreferences>) {
    const updatedPreferences = { ...preferences, ...changes };
    setSavedPreferences(updatedPreferences);
    saveCallMediaPreferences(updatedPreferences);
  }

  function toggleCamera() {
    if (isCameraOn && activeCameraId) updatePreferences({ cameraId: activeCameraId, isCameraOn: false });
    else updatePreferences({ isCameraOn: !isCameraOn });
  }

  return (
    <LocalMediaContext.Provider
      value={{
        localMedia,
        cameras,
        activeCameraId,
        selectCamera: (deviceId) => updatePreferences({ cameraId: deviceId }),
        microphones,
        activeMicrophoneId,
        selectMicrophone: (deviceId) => updatePreferences({ microphoneId: deviceId }),
        isCameraOn,
        toggleCamera,
        isMicOn,
        toggleMic: () => updatePreferences({ isMicOn: !isMicOn }),
      }}
    >
      {children}
    </LocalMediaContext.Provider>
  );
}
