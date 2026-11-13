import { vi } from 'vitest';

/** A stand-in for a MediaStreamTrack: jsdom does not implement WebRTC media. */
export function mockTrack(kind: 'audio' | 'video', deviceId = `${kind}-device`) {
  return {
    kind,
    id: `${kind}-${Math.random().toString(36).slice(2)}`,
    enabled: true,
    stop: vi.fn(),
    getSettings: () => ({ deviceId }),
  } as unknown as MediaStreamTrack & { stop: ReturnType<typeof vi.fn> };
}

/** A stand-in for a MediaStream holding the given tracks. */
export function mockStream(tracks: MediaStreamTrack[] = [mockTrack('video'), mockTrack('audio')]) {
  return {
    id: `stream-${Math.random().toString(36).slice(2)}`,
    getTracks: () => tracks,
    getVideoTracks: () => tracks.filter((track) => track.kind === 'video'),
    getAudioTracks: () => tracks.filter((track) => track.kind === 'audio'),
  } as unknown as MediaStream;
}

/**
 * Installs `navigator.mediaDevices` with spies. Returns them so a test can
 * control what `getUserMedia` resolves to and which devices are listed.
 */
export function installMediaDevices({
  stream = mockStream(),
  devices = [] as Partial<MediaDeviceInfo>[],
} = {}) {
  const listeners = new Set<() => void>();
  const mediaDevices = {
    getUserMedia: vi.fn().mockResolvedValue(stream),
    enumerateDevices: vi.fn().mockResolvedValue(devices),
    addEventListener: vi.fn((_: string, listener: () => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_: string, listener: () => void) => listeners.delete(listener)),
    /** Fires `devicechange` the way plugging a camera in would. */
    emitDeviceChange: () => listeners.forEach((listener) => listener()),
  };

  Object.defineProperty(navigator, 'mediaDevices', { value: mediaDevices, configurable: true });
  return mediaDevices;
}
