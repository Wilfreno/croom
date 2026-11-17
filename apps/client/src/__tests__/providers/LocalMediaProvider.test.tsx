import { installMediaDevices, mockStream, mockTrack } from '@/__tests__/mocks/mock-media';
import LocalMediaProvider, { useLocalMedia } from '@/components/providers/LocalMediaProvider';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { CALL_MEDIA_PREFERENCES_STORAGE_KEY } from '@repo/constants';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const wrapper = ({ children }: { children: React.ReactNode }) => <LocalMediaProvider>{children}</LocalMediaProvider>;

let mediaDevices: ReturnType<typeof installMediaDevices>;

beforeEach(() => {
  localStorage.clear();
  mediaDevices = installMediaDevices({
    stream: mockStream([mockTrack('video', 'cam-1'), mockTrack('audio', 'mic-1')]),
    devices: [
      { kind: 'videoinput', deviceId: 'cam-1', label: 'Front' },
      { kind: 'videoinput', deviceId: 'cam-2', label: 'Back' },
      { kind: 'audioinput', deviceId: 'mic-1', label: 'Built-in' },
      { kind: 'audioinput', deviceId: 'mic-2', label: 'Headset' },
    ],
  });
});

describe('useLocalMedia', () => {
  it('throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useLocalMedia())).toThrow('useLocalMedia must be used inside <LocalMediaProvider>');
  });
});

describe('LocalMediaProvider', () => {
  beforeEach(() => localStorage.setItem(CALL_MEDIA_PREFERENCES_STORAGE_KEY, JSON.stringify({ isCameraOn: true, isMicOn: true })));

  it('opens the camera and lists the cameras available', async () => {
    const { result } = renderHook(() => useLocalMedia(), { wrapper });

    await waitFor(() => expect(result.current.localMedia.status).toBe('ready'));
    await waitFor(() => expect(result.current.cameras.map((c) => c.deviceId)).toEqual(['cam-1', 'cam-2']));
    expect(result.current.isCameraOn).toBe(true);
    expect(result.current.activeCameraId).toBe('cam-1');
  });

  it('switches to the chosen camera', async () => {
    const { result } = renderHook(() => useLocalMedia(), { wrapper });
    await waitFor(() => expect(result.current.localMedia.status).toBe('ready'));

    act(() => result.current.selectCamera('cam-2'));

    expect(result.current.activeCameraId).toBe('cam-2');
    await waitFor(() =>
      expect(mediaDevices.getUserMedia).toHaveBeenLastCalledWith({ video: { deviceId: { exact: 'cam-2' } }, audio: true }),
    );
  });

  it('lists the microphones and switches to the chosen one', async () => {
    const { result } = renderHook(() => useLocalMedia(), { wrapper });
    await waitFor(() => expect(result.current.localMedia.status).toBe('ready'));
    await waitFor(() => expect(result.current.microphones.map((m) => m.deviceId)).toEqual(['mic-1', 'mic-2']));
    expect(result.current.activeMicrophoneId).toBe('mic-1');

    act(() => result.current.selectMicrophone('mic-2'));

    expect(result.current.activeMicrophoneId).toBe('mic-2');
    await waitFor(() =>
      expect(mediaDevices.getUserMedia).toHaveBeenLastCalledWith({ video: true, audio: { deviceId: { exact: 'mic-2' } } }),
    );
  });

  it('turns the camera off, keeping the microphone', async () => {
    const { result } = renderHook(() => useLocalMedia(), { wrapper });
    await waitFor(() => expect(result.current.localMedia.status).toBe('ready'));

    act(() => result.current.toggleCamera());

    expect(result.current.isCameraOn).toBe(false);
    await waitFor(() => expect(mediaDevices.getUserMedia).toHaveBeenLastCalledWith({ video: false, audio: true }));
  });

  it('brings back the same camera when it is turned on again', async () => {
    const { result } = renderHook(() => useLocalMedia(), { wrapper });
    await waitFor(() => expect(result.current.localMedia.status).toBe('ready'));

    act(() => result.current.toggleCamera());
    await waitFor(() => expect(mediaDevices.getUserMedia).toHaveBeenLastCalledWith({ video: false, audio: true }));
    act(() => result.current.toggleCamera());

    expect(result.current.isCameraOn).toBe(true);
    await waitFor(() =>
      expect(mediaDevices.getUserMedia).toHaveBeenLastCalledWith({ video: { deviceId: { exact: 'cam-1' } }, audio: true }),
    );
  });
});

describe('LocalMediaProvider remembering choices', () => {
  const savedPreferences = () => JSON.parse(localStorage.getItem(CALL_MEDIA_PREFERENCES_STORAGE_KEY) ?? 'null');

  it('starts with the camera and microphone that were chosen last time, camera off and muted', async () => {
    localStorage.setItem(
      CALL_MEDIA_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ cameraId: 'cam-2', microphoneId: 'mic-2', isCameraOn: false, isMicOn: false }),
    );

    const { result } = renderHook(() => useLocalMedia(), { wrapper });

    await waitFor(() => expect(result.current.localMedia.status).toBe('ready'));
    expect(mediaDevices.getUserMedia).toHaveBeenCalledOnce();
    expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({ video: false, audio: { deviceId: { exact: 'mic-2' } } });
    expect(result.current).toMatchObject({
      isCameraOn: false,
      isMicOn: false,
      activeCameraId: 'cam-2',
      activeMicrophoneId: 'mic-2',
    });
  });

  it('saves every choice as it is made', async () => {
    const { result } = renderHook(() => useLocalMedia(), { wrapper });
    await waitFor(() => expect(result.current.localMedia.status).toBe('ready'));

    act(() => result.current.selectCamera('cam-2'));
    act(() => result.current.selectMicrophone('mic-2'));
    act(() => result.current.toggleMic());
    act(() => result.current.toggleCamera());

    expect(savedPreferences()).toEqual({ cameraId: 'cam-2', microphoneId: 'mic-2', isCameraOn: true, isMicOn: false });
  });

  it('starts with the camera off and the microphone on the first time', async () => {
    const { result } = renderHook(() => useLocalMedia(), { wrapper });

    await waitFor(() => expect(result.current.localMedia.status).toBe('ready'));
    expect(result.current).toMatchObject({ isCameraOn: false, isMicOn: true });
    expect(mediaDevices.getUserMedia).toHaveBeenCalledOnce();
    expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({ video: false, audio: true });
  });

  it('starts with the camera off and the microphone on when nothing usable was saved', async () => {
    localStorage.setItem(CALL_MEDIA_PREFERENCES_STORAGE_KEY, 'not json');

    const { result } = renderHook(() => useLocalMedia(), { wrapper });

    await waitFor(() => expect(result.current.localMedia.status).toBe('ready'));
    expect(result.current).toMatchObject({ isCameraOn: false, isMicOn: true });
    expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({ video: false, audio: true });
  });
});
