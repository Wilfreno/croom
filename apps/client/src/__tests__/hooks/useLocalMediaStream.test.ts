import { installMediaDevices, mockStream, mockTrack } from '@/__tests__/mocks/mock-media';
import useLocalMediaStream, { useMediaDevices } from '@/components/hooks/useLocalMediaStream';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('useLocalMediaStream', () => {
  it('starts loading, then exposes the camera and microphone stream', async () => {
    const stream = mockStream();
    const mediaDevices = installMediaDevices({ stream });

    const { result } = renderHook(() => useLocalMediaStream());

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', stream, error: null }));
    expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({ video: true, audio: true });
  });

  it('asks for the exact camera that was chosen', async () => {
    const mediaDevices = installMediaDevices();

    renderHook(() => useLocalMediaStream({ cameraDeviceId: 'cam-2' }));

    await waitFor(() =>
      expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({ video: { deviceId: { exact: 'cam-2' } }, audio: true }),
    );
  });

  it('asks for the exact microphone that was chosen', async () => {
    const mediaDevices = installMediaDevices();

    renderHook(() => useLocalMediaStream({ microphoneDeviceId: 'mic-2' }));

    await waitFor(() =>
      expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({ video: true, audio: { deviceId: { exact: 'mic-2' } } }),
    );
  });

  it('asks for audio only when the camera is off', async () => {
    const mediaDevices = installMediaDevices();

    renderHook(() => useLocalMediaStream({ video: false }));

    await waitFor(() => expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({ video: false, audio: true }));
  });

  it('is off, without asking the browser, when both camera and microphone are off', async () => {
    const mediaDevices = installMediaDevices();

    const { result } = renderHook(() => useLocalMediaStream({ video: false, audio: false }));

    await waitFor(() => expect(result.current.status).toBe('off'));
    expect(mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });

  it('reports a readable error when access is refused', async () => {
    const mediaDevices = installMediaDevices();
    mediaDevices.getUserMedia.mockRejectedValue(new DOMException('', 'NotAllowedError'));

    const { result } = renderHook(() => useLocalMediaStream());

    await waitFor(() =>
      expect(result.current).toEqual({ status: 'error', stream: null, error: 'Camera access was blocked' }),
    );
  });

  it('stops the tracks of the stream when unmounted', async () => {
    const video = mockTrack('video');
    const audio = mockTrack('audio');
    installMediaDevices({ stream: mockStream([video, audio]) });

    const { result, unmount } = renderHook(() => useLocalMediaStream());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    unmount();

    expect(video.stop).toHaveBeenCalled();
    expect(audio.stop).toHaveBeenCalled();
  });

  it('stops a stream that arrives after the hook was unmounted', async () => {
    const video = mockTrack('video');
    let resolve!: (stream: MediaStream) => void;
    const mediaDevices = installMediaDevices();
    mediaDevices.getUserMedia.mockReturnValue(new Promise((r) => (resolve = r)));

    const { unmount } = renderHook(() => useLocalMediaStream());
    unmount();
    await act(async () => resolve(mockStream([video])));

    expect(video.stop).toHaveBeenCalled();
  });

  it('stops the old stream and opens a new one when switching cameras', async () => {
    const first = mockTrack('video', 'cam-1');
    const mediaDevices = installMediaDevices({ stream: mockStream([first]) });

    const { result, rerender } = renderHook(({ cameraDeviceId }) => useLocalMediaStream({ cameraDeviceId }), {
      initialProps: { cameraDeviceId: 'cam-1' },
    });
    await waitFor(() => expect(result.current.status).toBe('ready'));

    const second = mockStream([mockTrack('video', 'cam-2')]);
    mediaDevices.getUserMedia.mockResolvedValue(second);
    rerender({ cameraDeviceId: 'cam-2' });

    expect(first.stop).toHaveBeenCalled();
    await waitFor(() => expect(result.current.stream).toBe(second));
  });
});

describe('useMediaDevices', () => {
  const camera = (deviceId: string) => ({ kind: 'videoinput' as const, deviceId, label: deviceId });

  it('lists only devices of the asked kind that have a device id', async () => {
    installMediaDevices({
      devices: [camera('cam-1'), { kind: 'audioinput', deviceId: 'mic-1' }, camera('')],
    });

    const { result: cameras } = renderHook(() => useMediaDevices('videoinput'));
    const { result: microphones } = renderHook(() => useMediaDevices('audioinput'));

    await waitFor(() => expect(cameras.current.map(({ deviceId }) => deviceId)).toEqual(['cam-1']));
    await waitFor(() => expect(microphones.current.map(({ deviceId }) => deviceId)).toEqual(['mic-1']));
  });

  it('refreshes when a device is plugged in', async () => {
    const mediaDevices = installMediaDevices({ devices: [camera('cam-1')] });
    const { result } = renderHook(() => useMediaDevices('videoinput'));
    await waitFor(() => expect(result.current).toHaveLength(1));

    mediaDevices.enumerateDevices.mockResolvedValue([camera('cam-1'), camera('cam-2')]);
    await act(async () => mediaDevices.emitDeviceChange());

    await waitFor(() => expect(result.current).toHaveLength(2));
  });

  it('re-lists when the refresh key changes (labels appear once permission is granted)', async () => {
    const mediaDevices = installMediaDevices({ devices: [camera('cam-1')] });
    const { rerender } = renderHook(({ key }) => useMediaDevices('videoinput', key), { initialProps: { key: 1 } });
    await waitFor(() => expect(mediaDevices.enumerateDevices).toHaveBeenCalledTimes(1));

    rerender({ key: 2 });

    await waitFor(() => expect(mediaDevices.enumerateDevices).toHaveBeenCalledTimes(2));
  });

  it('stops listening for device changes once unmounted', () => {
    const mediaDevices = installMediaDevices();
    const { unmount } = renderHook(() => useMediaDevices('videoinput'));

    unmount();

    expect(mediaDevices.removeEventListener).toHaveBeenCalledWith('devicechange', expect.any(Function));
  });
});
