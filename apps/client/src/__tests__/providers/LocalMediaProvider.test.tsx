import { installMediaDevices, mockStream, mockTrack } from '@/__tests__/mocks/mock-media';
import LocalMediaProvider, { useLocalMedia } from '@/components/providers/LocalMediaProvider';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const wrapper = ({ children }: { children: React.ReactNode }) => <LocalMediaProvider>{children}</LocalMediaProvider>;

let mediaDevices: ReturnType<typeof installMediaDevices>;

beforeEach(() => {
  mediaDevices = installMediaDevices({
    stream: mockStream([mockTrack('video', 'cam-1'), mockTrack('audio')]),
    devices: [
      { kind: 'videoinput', deviceId: 'cam-1', label: 'Front' },
      { kind: 'videoinput', deviceId: 'cam-2', label: 'Back' },
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
