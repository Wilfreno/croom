import { mockStream, mockTrack } from '@/__tests__/mocks/mock-media';
import { mockSocket } from '@/__tests__/mocks/mock-socket';
import useMediasoupCall from '@/components/hooks/useMediasoupCall';
import { CALL_VIDEO_MAX_BITRATE } from '@repo/constants';
import type { CallJoinResult, CallProducerInfo } from '@repo/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* ---------- a fake mediasoup-client, just enough for the hook ---------- */

type Listener = (...args: never[]) => void;

class FakeEmitter {
  listeners = new Map<string, Listener>();
  on(event: string, listener: Listener) {
    this.listeners.set(event, listener);
  }
  fire(event: string, ...args: unknown[]) {
    (this.listeners.get(event) as ((...a: unknown[]) => void) | undefined)?.(...args);
  }
}

class FakeProducer {
  closed = false;
  constructor(
    public id: string,
    public kind: 'audio' | 'video',
    public track: MediaStreamTrack | null,
    public paused: boolean,
  ) {}
  pause = vi.fn(() => (this.paused = true));
  resume = vi.fn(() => (this.paused = false));
  replaceTrack = vi.fn(async ({ track }: { track: MediaStreamTrack | null }) => {
    this.track = track;
  });
}

class FakeTransport extends FakeEmitter {
  close = vi.fn();
  produced: { options: Record<string, unknown>; producer: FakeProducer }[] = [];
  constructor(public id: string) {
    super();
  }
  produce = vi.fn(async (options: { track: MediaStreamTrack; appData: { paused: boolean } }) => {
    // Like mediasoup, ask the app (the `produce` listener) for the server-side producer id.
    const id = await new Promise<string>((resolve, reject) =>
      this.fire(
        'produce',
        { kind: options.track.kind, rtpParameters: {}, appData: options.appData },
        ({ id }: { id: string }) => resolve(id),
        reject,
      ),
    );
    const producer = new FakeProducer(id, options.track.kind as 'audio' | 'video', options.track, false);
    this.produced.push({ options, producer });
    return producer;
  });
  consume = vi.fn(async ({ id, kind }: { id: string; kind: 'audio' | 'video' }) => ({
    id,
    kind,
    track: mockTrack(kind),
    close: vi.fn(),
  }));
}

const device = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));

vi.mock('mediasoup-client', () => ({
  Device: class {
    recvRtpCapabilities = { codecs: ['recv'] };
    sendTransport = new FakeTransport('send-transport');
    recvTransport = new FakeTransport('recv-transport');
    load = vi.fn(async () => undefined);
    createSendTransport = vi.fn(() => this.sendTransport);
    createRecvTransport = vi.fn(() => this.recvTransport);
    constructor() {
      device.current = this as unknown as Record<string, unknown>;
    }
  },
}));

function currentDevice() {
  return device.current as unknown as { sendTransport: FakeTransport; recvTransport: FakeTransport };
}

/* ---------- fixtures ---------- */

const CONVERSATION_ID = 'conversation-1';
const alice = { id: 'alice', displayName: 'Alice', photoUrl: null };
const bob = { id: 'bob', displayName: 'Bob', photoUrl: null };

function joinResult(overrides: Partial<CallJoinResult> = {}): CallJoinResult {
  return { rtpCapabilities: {}, members: [alice, bob], peers: [], producers: [], ...overrides };
}

let producerCounter = 0;

function callServer(join: CallJoinResult | (() => never) = joinResult()) {
  producerCounter = 0;
  return mockSocket({
    CALL_JOIN: join,
    CALL_CREATE_TRANSPORT: ({ direction }: { direction: string }) => ({
      id: `${direction}-transport`,
      iceParameters: {},
      iceCandidates: [],
      dtlsParameters: {},
    }),
    CALL_CONNECT_TRANSPORT: { ok: true },
    CALL_PRODUCE: () => ({ id: `server-producer-${++producerCounter}` }),
    CALL_SET_PRODUCER_PAUSED: { ok: true },
    CALL_CONSUME: ({ producerId }: { producerId: string }) => ({
      id: `consumer-of-${producerId}`,
      producerId,
      kind: producerId.startsWith('video') ? 'video' : 'audio',
      rtpParameters: {},
      producerPaused: producerId.endsWith('paused'),
    }),
    CALL_RESUME_CONSUMER: { ok: true },
  });
}

function producerInfo(peerId: string, producerId: string): CallProducerInfo {
  return { peerId, producerId, kind: producerId.startsWith('video') ? 'video' : 'audio', paused: false };
}

type Props = Parameters<typeof useMediasoupCall>[0];

function renderCall(server: ReturnType<typeof callServer> | null, overrides: Partial<Props> = {}) {
  return renderHook((props: Props) => useMediasoupCall(props), {
    initialProps: {
      socket: server?.socket ?? null,
      conversationId: CONVERSATION_ID,
      localStream: null,
      isCameraOn: true,
      ...overrides,
    },
  });
}

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined));
afterEach(() => vi.restoreAllMocks());

/* ---------- tests ---------- */

describe('useMediasoupCall', () => {
  describe('joining', () => {
    it('waits for a socket', () => {
      const { result } = renderCall(null);

      expect(result.current.status).toBe('connecting');
    });

    it('joins the conversation and becomes connected', async () => {
      const server = callServer();
      const { result } = renderCall(server);

      await waitFor(() => expect(result.current.status).toBe('connected'));
      expect(server.emitWithAck).toHaveBeenCalledWith('CALL_JOIN', { conversationId: CONVERSATION_ID });
      expect(result.current.members.get('alice')).toEqual(alice);
      expect(result.current.error).toBeNull();
    });

    it('creates one send and one receive transport', async () => {
      const server = callServer();
      const { result } = renderCall(server);

      await waitFor(() => expect(result.current.status).toBe('connected'));
      expect(server.emitWithAck).toHaveBeenCalledWith('CALL_CREATE_TRANSPORT', { direction: 'send' });
      expect(server.emitWithAck).toHaveBeenCalledWith('CALL_CREATE_TRANSPORT', { direction: 'recv' });
    });

    it('lists the people already in the call', async () => {
      const server = callServer(joinResult({ peers: [{ peerId: 'p-bob', userId: 'bob' }] }));
      const { result } = renderCall(server);

      await waitFor(() => expect(result.current.participants).toHaveLength(1));
      expect(result.current.participants[0]).toMatchObject({ peerId: 'p-bob', userId: 'bob', videoTrack: null });
    });

    it('receives the media that is already being sent', async () => {
      const server = callServer(
        joinResult({
          peers: [{ peerId: 'p-bob', userId: 'bob' }],
          producers: [producerInfo('p-bob', 'video-1'), producerInfo('p-bob', 'audio-1')],
        }),
      );
      const { result } = renderCall(server);

      await waitFor(() => {
        const [bobParticipant] = result.current.participants;
        expect(bobParticipant.videoTrack).not.toBeNull();
        expect(bobParticipant.audioTrack).not.toBeNull();
      });
      expect(server.emitWithAck).toHaveBeenCalledWith('CALL_CONSUME', {
        producerId: 'video-1',
        rtpCapabilities: { codecs: ['recv'] },
      });
      expect(server.emitWithAck).toHaveBeenCalledWith('CALL_RESUME_CONSUMER', { consumerId: 'consumer-of-video-1' });
    });

    it('reports why joining failed', async () => {
      const server = callServer(joinResult());
      server.replies.CALL_JOIN = { error: 'you cannot call this conversation' };

      const { result } = renderCall(server);

      await waitFor(() => expect(result.current.status).toBe('error'));
      expect(result.current.error).toBe('you cannot call this conversation');
    });

    it('connects a transport through the server when mediasoup asks', async () => {
      const server = callServer();
      const { result } = renderCall(server);
      await waitFor(() => expect(result.current.status).toBe('connected'));

      const callback = vi.fn();
      currentDevice().sendTransport.fire('connect', { dtlsParameters: { role: 'client' } }, callback, vi.fn());

      await waitFor(() => expect(callback).toHaveBeenCalled());
      expect(server.emitWithAck).toHaveBeenCalledWith('CALL_CONNECT_TRANSPORT', {
        transportId: 'send-transport',
        dtlsParameters: { role: 'client' },
      });
    });

    it('passes a failed transport connect back to mediasoup', async () => {
      const server = callServer();
      delete server.replies.CALL_CONNECT_TRANSPORT;
      const { result } = renderCall(server);
      await waitFor(() => expect(result.current.status).toBe('connected'));

      const errback = vi.fn();
      currentDevice().recvTransport.fire('connect', { dtlsParameters: {} }, vi.fn(), errback);

      await waitFor(() => expect(errback).toHaveBeenCalledWith(expect.any(Error)));
    });

    it('shows an error when the connection to the call is lost', async () => {
      const server = callServer();
      const { result } = renderCall(server);
      await waitFor(() => expect(result.current.status).toBe('connected'));

      act(() => currentDevice().recvTransport.fire('connectionstatechange', 'failed'));

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Lost the connection to the call');
    });
  });

  describe('other participants', () => {
    it('adds someone who joins and removes them when they leave', async () => {
      const server = callServer();
      const { result } = renderCall(server);
      await waitFor(() => expect(result.current.status).toBe('connected'));

      act(() => server.serverEmit('CALL_PEER_JOINED', { peerId: 'p-bob', userId: 'bob' }));
      expect(result.current.participants.map((p) => p.peerId)).toEqual(['p-bob']);

      act(() => server.serverEmit('CALL_PEER_JOINED', { peerId: 'p-bob', userId: 'bob' }));
      expect(result.current.participants).toHaveLength(1);

      act(() => server.serverEmit('CALL_PEER_LEFT', { peerId: 'p-bob' }));
      expect(result.current.participants).toEqual([]);
    });

    it('receives new media and shows it as paused or not', async () => {
      const server = callServer(joinResult({ peers: [{ peerId: 'p-bob', userId: 'bob' }] }));
      const { result } = renderCall(server);
      await waitFor(() => expect(result.current.status).toBe('connected'));

      act(() => server.serverEmit('CALL_NEW_PRODUCER', producerInfo('p-bob', 'video-paused')));

      await waitFor(() => expect(result.current.participants[0].videoTrack).not.toBeNull());
      expect(result.current.participants[0].isVideoPaused).toBe(true);
    });

    it('receives each producer only once', async () => {
      const server = callServer(joinResult({ peers: [{ peerId: 'p-bob', userId: 'bob' }] }));
      const { result } = renderCall(server);
      await waitFor(() => expect(result.current.status).toBe('connected'));

      act(() => {
        server.serverEmit('CALL_NEW_PRODUCER', producerInfo('p-bob', 'audio-1'));
        server.serverEmit('CALL_NEW_PRODUCER', producerInfo('p-bob', 'audio-1'));
      });

      await waitFor(() => expect(result.current.participants[0].audioTrack).not.toBeNull());
      const consumeCalls = server.emitWithAck.mock.calls.filter(([event]) => event === 'CALL_CONSUME');
      expect(consumeCalls).toHaveLength(1);
    });

    it('follows a participant muting and unmuting', async () => {
      const server = callServer(
        joinResult({ peers: [{ peerId: 'p-bob', userId: 'bob' }], producers: [producerInfo('p-bob', 'audio-1')] }),
      );
      const { result } = renderCall(server);
      await waitFor(() => expect(result.current.participants[0].audioTrack).not.toBeNull());

      act(() => server.serverEmit('CALL_PRODUCER_PAUSED', { producerId: 'audio-1', paused: true }));
      expect(result.current.participants[0].isAudioPaused).toBe(true);

      act(() => server.serverEmit('CALL_PRODUCER_PAUSED', { producerId: 'audio-1', paused: false }));
      expect(result.current.participants[0].isAudioPaused).toBe(false);
    });

    it('drops the track and closes the consumer when a producer closes', async () => {
      const server = callServer(
        joinResult({ peers: [{ peerId: 'p-bob', userId: 'bob' }], producers: [producerInfo('p-bob', 'video-1')] }),
      );
      const { result } = renderCall(server);
      await waitFor(() => expect(result.current.participants[0].videoTrack).not.toBeNull());
      const consumer = await currentDevice().recvTransport.consume.mock.results[0].value;

      act(() => server.serverEmit('CALL_PRODUCER_CLOSED', { producerId: 'video-1' }));

      expect(result.current.participants[0].videoTrack).toBeNull();
      expect(consumer.close).toHaveBeenCalled();
    });

    it('ignores events about producers it never received', async () => {
      const server = callServer(joinResult({ peers: [{ peerId: 'p-bob', userId: 'bob' }] }));
      const { result } = renderCall(server);
      await waitFor(() => expect(result.current.status).toBe('connected'));

      act(() => {
        server.serverEmit('CALL_PRODUCER_PAUSED', { producerId: 'unknown', paused: true });
        server.serverEmit('CALL_PRODUCER_CLOSED', { producerId: 'unknown' });
      });

      expect(result.current.participants[0]).toMatchObject({ isAudioPaused: false, isVideoPaused: false });
    });

    it('keeps the call going when one stream cannot be received', async () => {
      const server = callServer(joinResult({ peers: [{ peerId: 'p-bob', userId: 'bob' }] }));
      server.replies.CALL_CONSUME = { error: 'cannot consume' };
      const { result } = renderCall(server);
      await waitFor(() => expect(result.current.status).toBe('connected'));

      act(() => server.serverEmit('CALL_NEW_PRODUCER', producerInfo('p-bob', 'video-1')));

      await waitFor(() => expect(console.error).toHaveBeenCalledWith('Could not receive media', expect.any(Error)));
      expect(result.current.status).toBe('connected');
    });
  });

  describe('publishing your camera and microphone', () => {
    it('sends both tracks, capping the video bitrate, without letting mediasoup stop them', async () => {
      const video = mockTrack('video');
      const audio = mockTrack('audio');
      const server = callServer();
      renderCall(server, { localStream: mockStream([video, audio]) });

      await waitFor(() => expect(currentDevice().sendTransport.produced).toHaveLength(2));
      const [first, second] = currentDevice().sendTransport.produced;
      expect(first.options).toMatchObject({ track: audio, stopTracks: false, encodings: undefined });
      expect(second.options).toMatchObject({
        track: video,
        stopTracks: false,
        encodings: [{ maxBitrate: CALL_VIDEO_MAX_BITRATE }],
      });
      expect(server.emitWithAck).toHaveBeenCalledWith('CALL_PRODUCE', expect.objectContaining({ kind: 'video', paused: false }));
    });

    it('sends nothing until there is a stream', async () => {
      const server = callServer();
      const { result } = renderCall(server);
      await waitFor(() => expect(result.current.status).toBe('connected'));

      expect(currentDevice().sendTransport.produce).not.toHaveBeenCalled();
    });

    it('starts the video paused when the camera is off', async () => {
      const server = callServer();
      renderCall(server, { localStream: mockStream([mockTrack('video')]), isCameraOn: false });

      await waitFor(() => expect(currentDevice().sendTransport.produced).toHaveLength(1));
      expect(server.emitWithAck).toHaveBeenCalledWith('CALL_PRODUCE', expect.objectContaining({ paused: true }));
      expect(currentDevice().sendTransport.produced[0].producer.pause).toHaveBeenCalled();
    });

    it('pauses and resumes the video as the camera is toggled, telling the server', async () => {
      const stream = mockStream([mockTrack('video')]);
      const server = callServer();
      const { rerender } = renderCall(server, { localStream: stream });
      await waitFor(() => expect(currentDevice().sendTransport.produced).toHaveLength(1));
      const { producer } = currentDevice().sendTransport.produced[0];

      rerender({ socket: server.socket, conversationId: CONVERSATION_ID, localStream: stream, isCameraOn: false });
      await waitFor(() =>
        expect(server.emitWithAck).toHaveBeenCalledWith('CALL_SET_PRODUCER_PAUSED', { producerId: producer.id, paused: true }),
      );
      expect(producer.pause).toHaveBeenCalled();

      rerender({ socket: server.socket, conversationId: CONVERSATION_ID, localStream: stream, isCameraOn: true });
      await waitFor(() =>
        expect(server.emitWithAck).toHaveBeenCalledWith('CALL_SET_PRODUCER_PAUSED', { producerId: producer.id, paused: false }),
      );
      expect(producer.resume).toHaveBeenCalled();
    });

    it('mutes and unmutes the microphone with toggleMic', async () => {
      const server = callServer();
      const { result } = renderCall(server, { localStream: mockStream([mockTrack('audio')]) });
      await waitFor(() => expect(currentDevice().sendTransport.produced).toHaveLength(1));
      const { producer } = currentDevice().sendTransport.produced[0];

      act(() => result.current.toggleMic());

      expect(result.current.isMicOn).toBe(false);
      await waitFor(() =>
        expect(server.emitWithAck).toHaveBeenCalledWith('CALL_SET_PRODUCER_PAUSED', { producerId: producer.id, paused: true }),
      );
    });

    it('swaps in the new track when the camera changes, without a new producer', async () => {
      const server = callServer();
      const { rerender } = renderCall(server, { localStream: mockStream([mockTrack('video', 'cam-1')]) });
      await waitFor(() => expect(currentDevice().sendTransport.produced).toHaveLength(1));
      const { producer } = currentDevice().sendTransport.produced[0];

      const newTrack = mockTrack('video', 'cam-2');
      rerender({
        socket: server.socket,
        conversationId: CONVERSATION_ID,
        localStream: mockStream([newTrack]),
        isCameraOn: true,
      });

      await waitFor(() => expect(producer.replaceTrack).toHaveBeenCalledWith({ track: newTrack }));
      expect(currentDevice().sendTransport.produce).toHaveBeenCalledTimes(1);
    });
  });

  describe('leaving', () => {
    it('stops listening, tells the server and closes both transports on unmount', async () => {
      const server = callServer();
      const { result, unmount } = renderCall(server);
      await waitFor(() => expect(result.current.status).toBe('connected'));
      const { sendTransport, recvTransport } = currentDevice();

      unmount();

      expect(server.spies.emit).toHaveBeenCalledWith('CALL_LEAVE');
      expect(sendTransport.close).toHaveBeenCalled();
      expect(recvTransport.close).toHaveBeenCalled();
      for (const event of [
        'CALL_PEER_JOINED',
        'CALL_PEER_LEFT',
        'CALL_NEW_PRODUCER',
        'CALL_PRODUCER_CLOSED',
        'CALL_PRODUCER_PAUSED',
      ])
        expect(server.listenerCount(event)).toBe(0);
    });

    it('closes a session that finishes setting up after leaving', async () => {
      let finishJoin!: (value: CallJoinResult) => void;
      const server = callServer();
      server.replies.CALL_JOIN = () => new Promise((resolve) => (finishJoin = resolve));
      const { unmount } = renderCall(server);
      await waitFor(() => expect(finishJoin).toBeDefined());

      unmount();
      await act(async () => finishJoin(joinResult()));

      expect(server.emitWithAck).not.toHaveBeenCalledWith('CALL_CREATE_TRANSPORT', expect.anything());
    });
  });
});
