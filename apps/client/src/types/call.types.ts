import type { CallMember, MediaKind } from '@repo/types';
import type { Device } from 'mediasoup-client';
import type { Consumer, Producer, Transport } from 'mediasoup-client/types';

export type LocalMediaState =
  | { status: 'off'; stream: null; error: null } // camera and microphone both turned off
  | { status: 'loading'; stream: null; error: null }
  | { status: 'ready'; stream: MediaStream; error: null }
  | { status: 'error'; stream: null; error: string };

export type LocalMediaOptions = {
  cameraDeviceId?: string;
  video?: boolean;
  audio?: boolean;
};

export type LocalMediaContextType = {
  localMedia: LocalMediaState;
  cameras: MediaDeviceInfo[];
  activeCameraId?: string;
  selectCamera: (cameraDeviceId: string) => void;
  isCameraOn: boolean;
  toggleCamera: () => void;
};

export type CallStatus = 'connecting' | 'connected' | 'error';

/** One remote socket in the call, with whatever media it is currently sending. */
export type CallParticipant = {
  peerId: string;
  userId: string;
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  isAudioPaused: boolean;
  isVideoPaused: boolean;
};

export type CallContextType = {
  status: CallStatus;
  error: string | null;
  members: Map<string, CallMember>;
  participants: CallParticipant[];
  isMicOn: boolean;
  toggleMic: () => void;
  leave: () => void;
};

/** One row in the participants side panel. */
export type ParticipantListItem = {
  key: string;
  displayName: string;
  photoUrl: string | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isYou?: boolean;
};

/** Everything one join of a call holds on to; closed when the call is left. */
export type CallSession = {
  device: Device;
  sendTransport: Transport;
  recvTransport: Transport;
  producers: Partial<Record<MediaKind, Producer>>;
  consumers: Map<string, { consumer: Consumer; peerId: string }>; // keyed by producer id
  publishQueue: Promise<void>;
};
