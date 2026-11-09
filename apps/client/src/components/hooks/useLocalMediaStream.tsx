'use client';
import { LocalMediaOptions, LocalMediaState } from '@/types/call.types';
import { useCallback, useEffect, useState } from 'react';


export default function useLocalMediaStream({
  cameraDeviceId,
  video = true,
  audio = true,
}: LocalMediaOptions = {}) {
  const [mediaState, setMediaState] = useState<LocalMediaState>({ status: 'loading', stream: null, error: null });

  useEffect(() => {
    let isCancelled = false;
    let openedStream: MediaStream | null = null;

    
    if (!video && !audio) {
      setMediaState({ status: 'off', stream: null, error: null });
      return;
    }

    setMediaState({ status: 'loading', stream: null, error: null });
    navigator.mediaDevices
      .getUserMedia({
        video: video && (cameraDeviceId ? { deviceId: { exact: cameraDeviceId } } : true),
        audio,
      })
      .then((stream) => {
        // The component unmounted (or the camera changed) while we were waiting: release it right away.
        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        openedStream = stream;
        setMediaState({ status: 'ready', stream, error: null });
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        setMediaState({ status: 'error', stream: null, error: getMediaErrorMessage(error) });
      });

    return () => {
      isCancelled = true;
      openedStream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraDeviceId, video, audio]);

  return mediaState;
}

// Lists the cameras on this device and keeps the list current when one is plugged in or removed.
// Browsers hide camera names until camera permission is granted, so pass `refreshKey` (e.g. the
// stream) to re-read the list once access is allowed.
export function useCameraDevices(refreshKey?: unknown) {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);

  const refreshCameras = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    setCameras(devices.filter((device) => device.kind === 'videoinput' && device.deviceId));
  }, []);

  useEffect(() => {
    refreshCameras();
    navigator.mediaDevices.addEventListener('devicechange', refreshCameras);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshCameras);
  }, [refreshCameras, refreshKey]);

  return cameras;
}

function getMediaErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') return 'Camera access was blocked';
    if (error.name === 'NotFoundError') return 'No camera or microphone found';
    if (error.name === 'NotReadableError') return 'Camera is being used by another app';
    if (error.name === 'OverconstrainedError') return 'That camera is no longer available';
  }
  return 'Could not start the camera';
}
