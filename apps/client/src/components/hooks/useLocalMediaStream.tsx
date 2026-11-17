'use client';
import { getMediaErrorMessage } from '@/lib/utils';
import { LocalMediaOptions, LocalMediaState } from '@/types/call.types';
import { useCallback, useEffect, useState } from 'react';


export default function useLocalMediaStream({
  cameraDeviceId,
  microphoneDeviceId,
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
        audio: audio && (microphoneDeviceId ? { deviceId: { exact: microphoneDeviceId } } : true),
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
  }, [cameraDeviceId, microphoneDeviceId, video, audio]);

  return mediaState;
}

export function useMediaDevices(kind: MediaDeviceKind, refreshKey?: unknown) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const refreshDevices = useCallback(async () => {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    setDevices(allDevices.filter((device) => device.kind === kind && device.deviceId));
  }, [kind]);

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
  }, [refreshDevices, refreshKey]);

  return devices;
}

