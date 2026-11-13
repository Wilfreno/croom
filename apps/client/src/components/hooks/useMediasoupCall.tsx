'use client';
import { closeSession, emitSocketEventAndWaitForServerReply } from '@/lib/utils';
import { CallParticipant, CallSession, CallStatus } from '@/types/call.types';
import { TypedSocket } from '@/types/socket.types';
import { CALL_VIDEO_MAX_BITRATE } from '@repo/constants';
import type { CallMember, CallProducerInfo } from '@repo/types';
import { Device } from 'mediasoup-client';
import type { RtpCapabilities, Transport } from 'mediasoup-client/types';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Joins the conversation's call over the `/io` socket and keeps it in sync:
 * publishes the local camera/mic, consumes every other participant's media,
 * and tracks participants joining, leaving, muting and turning their camera off.
 */
export default function useMediasoupCall({
  socket,
  conversationId,
  localStream,
  isCameraOn,
}: {
  socket: TypedSocket | null;
  conversationId: string;
  localStream: MediaStream | null;
  isCameraOn: boolean;
}) {
  const [status, setStatus] = useState<CallStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Map<string, CallMember>>(new Map());
  const [participants, setParticipants] = useState<Map<string, CallParticipant>>(new Map());
  const [isMicOn, setIsMicOn] = useState(true);
  const sessionRef = useRef<CallSession | null>(null);

  const updateParticipant = useCallback(
    (peerId: string, update: (participant: CallParticipant) => CallParticipant) =>
      setParticipants((prev) => {
        const participant = prev.get(peerId);
        if (!participant) return prev;
        return new Map(prev).set(peerId, update(participant));
      }),
    [],
  );

  // Join on mount (and again if the socket reconnects as a new instance); leave on unmount.
  useEffect(() => {
    if (!socket) return;
    let isCancelled = false;
    let session: CallSession | null = null;
    const pendingProducerIds = new Set<string>();

    let markReady!: () => void;
    const ready = new Promise<void>((resolve) => (markReady = resolve));

    setStatus('connecting');
    setError(null);
    setParticipants(new Map());

    function addPeer(peerId: string, userId: string) {
      setParticipants((prev) =>
        prev.has(peerId)
          ? prev
          : new Map(prev).set(peerId, {
              peerId,
              userId,
              audioTrack: null,
              videoTrack: null,
              isAudioPaused: false,
              isVideoPaused: false,
            }),
      );
    }

    async function consume({ peerId, producerId }: CallProducerInfo) {
      await ready;
      if (isCancelled || !session || !socket) return;
      if (session.consumers.has(producerId) || pendingProducerIds.has(producerId)) return;
      pendingProducerIds.add(producerId);

      try {
        const params = await emitSocketEventAndWaitForServerReply(socket, 'CALL_CONSUME', {
          producerId,
          rtpCapabilities: session.device.recvRtpCapabilities,
        });
        const consumer = await session.recvTransport.consume({
          id: params.id,
          producerId: params.producerId,
          kind: params.kind,
          rtpParameters: params.rtpParameters as Parameters<Transport['consume']>[0]['rtpParameters'],
        });
        if (isCancelled) return consumer.close();

        session.consumers.set(producerId, { consumer, peerId });
        await emitSocketEventAndWaitForServerReply(socket, 'CALL_RESUME_CONSUMER', { consumerId: consumer.id });

        updateParticipant(peerId, (participant) =>
          params.kind === 'video'
            ? { ...participant, videoTrack: consumer.track, isVideoPaused: params.producerPaused }
            : { ...participant, audioTrack: consumer.track, isAudioPaused: params.producerPaused },
        );
      } catch (consumeError) {
        console.error('Could not receive media', consumeError);
      } finally {
        pendingProducerIds.delete(producerId);
      }
    }

    function onPeerJoined({ peerId, userId }: { peerId: string; userId: string }) {
      addPeer(peerId, userId);
    }
    function onPeerLeft({ peerId }: { peerId: string }) {
      setParticipants((prev) => {
        const next = new Map(prev);
        next.delete(peerId);
        return next;
      });
    }
    function onNewProducer(producer: CallProducerInfo) {
      void consume(producer);
    }
    function onProducerClosed({ producerId }: { producerId: string }) {
      const entry = session?.consumers.get(producerId);
      if (!entry) return;
      session?.consumers.delete(producerId);
      entry.consumer.close();
      updateParticipant(entry.peerId, (participant) =>
        entry.consumer.kind === 'video' ? { ...participant, videoTrack: null } : { ...participant, audioTrack: null },
      );
    }
    function onProducerPaused({ producerId, paused }: { producerId: string; paused: boolean }) {
      const entry = session?.consumers.get(producerId);
      if (!entry) return;
      updateParticipant(entry.peerId, (participant) =>
        entry.consumer.kind === 'video'
          ? { ...participant, isVideoPaused: paused }
          : { ...participant, isAudioPaused: paused },
      );
    }

    socket.on('CALL_PEER_JOINED', onPeerJoined);
    socket.on('CALL_PEER_LEFT', onPeerLeft);
    socket.on('CALL_NEW_PRODUCER', onNewProducer);
    socket.on('CALL_PRODUCER_CLOSED', onProducerClosed);
    socket.on('CALL_PRODUCER_PAUSED', onProducerPaused);

    async function join(socket: TypedSocket) {
      const joined = await emitSocketEventAndWaitForServerReply(socket, 'CALL_JOIN', { conversationId });
      if (isCancelled) return;

      setMembers(new Map(joined.members.map((member) => [member.id, member])));
      joined.peers.forEach(({ peerId, userId }) => addPeer(peerId, userId));

      const device = new Device();
      await device.load({ routerRtpCapabilities: joined.rtpCapabilities as RtpCapabilities });

      const [sendOptions, recvOptions] = await Promise.all([
        emitSocketEventAndWaitForServerReply(socket, 'CALL_CREATE_TRANSPORT', { direction: 'send' }),
        emitSocketEventAndWaitForServerReply(socket, 'CALL_CREATE_TRANSPORT', { direction: 'recv' }),
      ]);
      type TransportOptions = Parameters<Device['createSendTransport']>[0];
      const sendTransport = device.createSendTransport(sendOptions as unknown as TransportOptions);
      const recvTransport = device.createRecvTransport(recvOptions as unknown as TransportOptions);

      for (const transport of [sendTransport, recvTransport]) {
        transport.on('connect', ({ dtlsParameters }, callback, errback) => {
          emitSocketEventAndWaitForServerReply(socket, 'CALL_CONNECT_TRANSPORT', { transportId: transport.id, dtlsParameters })
            .then(() => callback())
            .catch(errback);
        });
        transport.on('connectionstatechange', (state) => {
          if (state === 'failed' && !isCancelled) {
            setStatus('error');
            setError('Lost the connection to the call');
          }
        });
      }
      sendTransport.on('produce', ({ kind, rtpParameters, appData }, callback, errback) => {
        emitSocketEventAndWaitForServerReply(socket, 'CALL_PRODUCE', { kind, rtpParameters, paused: Boolean(appData.paused) })
          .then(({ id }) => callback({ id }))
          .catch(errback);
      });

      session = {
        device,
        sendTransport,
        recvTransport,
        producers: {},
        consumers: new Map(),
        publishQueue: Promise.resolve(),
      };
      if (isCancelled) return closeSession(session);

      sessionRef.current = session;
      markReady();
      setStatus('connected');
      joined.producers.forEach((producer) => void consume(producer));
    }

    join(socket).catch((joinError: unknown) => {
      if (isCancelled) return;
      setStatus('error');
      setError(joinError instanceof Error ? joinError.message : 'Could not join the call');
    });

    return () => {
      isCancelled = true;
      socket.off('CALL_PEER_JOINED', onPeerJoined);
      socket.off('CALL_PEER_LEFT', onPeerLeft);
      socket.off('CALL_NEW_PRODUCER', onNewProducer);
      socket.off('CALL_PRODUCER_CLOSED', onProducerClosed);
      socket.off('CALL_PRODUCER_PAUSED', onProducerPaused);
      socket.emit('CALL_LEAVE');
      if (session) closeSession(session);
      sessionRef.current = null;
    };
  }, [socket, conversationId, updateParticipant]);

  // Keep what we send in step with the local stream: produce new tracks, swap in replaced ones
  // (LocalMediaProvider opens a fresh stream when the camera changes), and pause what's turned off.
  useEffect(() => {
    const session = sessionRef.current;
    if (status !== 'connected' || !session || !socket) return;

    session.publishQueue = session.publishQueue
      .then(async () => {
        for (const kind of ['audio', 'video'] as const) {
          const track = localStream?.getTracks().find((candidate) => candidate.kind === kind) ?? null;
          const shouldPause = !track || (kind === 'video' ? !isCameraOn : !isMicOn);
          let producer = session.producers[kind];

          if (!producer) {
            if (!track) continue;
            // LocalMediaProvider owns the tracks, so mediasoup must not stop them.
            producer = await session.sendTransport.produce({
              track,
              // Capped so a call costs the server less CPU and upload bandwidth; audio is small already.
              encodings: kind === 'video' ? [{ maxBitrate: CALL_VIDEO_MAX_BITRATE }] : undefined,
              stopTracks: false,
              appData: { paused: shouldPause },
            });
            session.producers[kind] = producer;
            if (shouldPause) producer.pause();
            continue;
          }

          if (producer.track !== track) await producer.replaceTrack({ track });
          if (producer.paused !== shouldPause) {
            if (shouldPause) producer.pause();
            else producer.resume();
            await emitSocketEventAndWaitForServerReply(socket, 'CALL_SET_PRODUCER_PAUSED', { producerId: producer.id, paused: shouldPause });
          }
        }
      })
      .catch((publishError) => console.error('Could not publish media', publishError));
  }, [status, socket, localStream, isCameraOn, isMicOn]);

  const toggleMic = useCallback(() => setIsMicOn((wasOn) => !wasOn), []);

  return {
    status,
    error,
    members,
    participants: [...participants.values()],
    isMicOn,
    toggleMic,
  };
}

