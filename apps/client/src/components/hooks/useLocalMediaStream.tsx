'use client';
import { getMediaErrorMessage } from '@/lib/utils';
import { LocalMediaOptions, LocalMediaState } from '@/types/call.types';
import { useCallback, useEffect, useState } from 'react';


export default function useLocalMediaStream({
  cameraDeviceId,
  microphoneDeviceId,
  video = true,
  audio = true,
  enabled = true,
}: LocalMediaOptions = {}) {
  const [mediaState, setMediaState] = useState<LocalMediaState>({ status: 'loading', stream: null, error: null });

  useEffect(() => {
    let isCancelled = false;
    let openedStream: MediaStream | null = null;

    
    if (!enabled) {
      setMediaState({ status: 'loading', stream: null, error: null });
      return;
    }

    if (!video && !audio) {
      setMediaState({ status: 'off', stream: null, error: null });
      return;
    }

    setMediaState({ status: 'loading', stream: null, error: null });
    const hasChosenDevice = Boolean(cameraDeviceId || microphoneDeviceId);
    navigator.mediaDevices
      .getUserMedia({
        video: video && (cameraDeviceId ? { deviceId: { exact: cameraDeviceId } } : true),
        audio: audio && (microphoneDeviceId ? { deviceId: { exact: microphoneDeviceId } } : true),
      })
      .catch((error: unknown) => {
        const isChosenDeviceGone = error instanceof DOMException && error.name === 'OverconstrainedError';
        if (hasChosenDevice && isChosenDeviceGone) return navigator.mediaDevices.getUserMedia({ video, audio });
        throw error;
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
  }, [cameraDeviceId, microphoneDeviceId, video, audio, enabled]);

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

