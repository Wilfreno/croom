'use client';
import { getMediaErrorMessage } from '@/lib/utils';
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

