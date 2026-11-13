import type { RouterRtpCodecCapability } from 'mediasoup/types';

/** Codecs every call router offers: Opus for audio, VP8 and H264 for video. */
export const MEDIASOUP_MEDIA_CODECS: RouterRtpCodecCapability[] = [
  { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
  { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 },
  {
    kind: 'video',
    mimeType: 'video/H264',
    clockRate: 90000,
    parameters: {
      'packetization-mode': 1,
      'profile-level-id': '42e01f',
      'level-asymmetry-allowed': 1,
    },
  },
];

/** First port the WebRtcServers listen on when `MEDIASOUP_PORT` isn't set; worker i uses this + i. */
export const MEDIASOUP_DEFAULT_PORT = 40000;

/**
 * How many people one router (one call's slice on one worker) takes before the call spills onto
 * another worker, when `MEDIASOUP_MAX_PEERS_PER_ROUTER` isn't set. Six people in a 12-person call
 * is about 130 forwarded streams per worker instead of 264 on one.
 */
export const MEDIASOUP_DEFAULT_MAX_PEERS_PER_ROUTER = 6;
