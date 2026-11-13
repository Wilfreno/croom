import { UserStatus } from "@repo/enums";
import { MessagePayload } from "./entity.types";

export interface UserStatusPayload {
  userId: string;
  status: UserStatus;
  lastOnline: string;
}

export interface CallPayload {
  conversationId: string;
}

export interface IncomingCallPayload {
  conversationId: string;
  caller: {
    id: string;
    displayName: string;
    photoUrl: string | null;
  };
}

/**
 * mediasoup objects (RTP capabilities, ICE/DTLS parameters, RTP parameters) travel as plain JSON.
 * This package doesn't depend on mediasoup, so each side casts them to its own mediasoup types.
 */
export type MediasoupJson = Record<string, any>;

export type MediaKind = 'audio' | 'video';

/** Socket.io acknowledgement result: the value, or why the request failed. */
export type CallAck<T> = T | { error: string };

export interface CallMember {
  id: string;
  displayName: string;
  photoUrl: string | null;
}

/** One socket in a call. A user with two tabs in the same call is two peers. */
export interface CallPeer {
  peerId: string;
  userId: string;
}

export interface CallProducerInfo {
  peerId: string;
  producerId: string;
  kind: MediaKind;
  paused: boolean;
}

export interface CallJoinResult {
  rtpCapabilities: MediasoupJson;
  members: CallMember[];
  peers: CallPeer[];
  producers: CallProducerInfo[];
}

export interface CallTransportOptions {
  id: string;
  iceParameters: MediasoupJson;
  iceCandidates: MediasoupJson[];
  dtlsParameters: MediasoupJson;
}

export interface CallConsumeResult {
  id: string;
  producerId: string;
  kind: MediaKind;
  rtpParameters: MediasoupJson;
  producerPaused: boolean;
}

export interface ServerToClientEvents {
  ERROR: (error: string) => void;
  MESSAGE: (message: MessagePayload) => void;
  USER_STATUS: (payload: UserStatusPayload) => void;
  INCOMING_CALL: (payload: IncomingCallPayload) => void;
  CALL_PEER_JOINED: (peer: CallPeer) => void;
  CALL_PEER_LEFT: (payload: { peerId: string }) => void;
  CALL_NEW_PRODUCER: (producer: CallProducerInfo) => void;
  CALL_PRODUCER_CLOSED: (payload: { producerId: string }) => void;
  CALL_PRODUCER_PAUSED: (payload: { producerId: string; paused: boolean }) => void;
}

export interface ClientToServerEvents {
  CALL: (payload: CallPayload) => void;
  CALL_JOIN: (payload: CallPayload, ack: (result: CallAck<CallJoinResult>) => void) => void;
  CALL_CREATE_TRANSPORT: (
    payload: { direction: 'send' | 'recv' },
    ack: (result: CallAck<CallTransportOptions>) => void,
  ) => void;
  CALL_CONNECT_TRANSPORT: (
    payload: { transportId: string; dtlsParameters: MediasoupJson },
    ack: (result: CallAck<{ ok: true }>) => void,
  ) => void;
  CALL_PRODUCE: (
    payload: { kind: MediaKind; rtpParameters: MediasoupJson; paused?: boolean },
    ack: (result: CallAck<{ id: string }>) => void,
  ) => void;
  CALL_SET_PRODUCER_PAUSED: (
    payload: { producerId: string; paused: boolean },
    ack: (result: CallAck<{ ok: true }>) => void,
  ) => void;
  CALL_CONSUME: (
    payload: { producerId: string; rtpCapabilities: MediasoupJson },
    ack: (result: CallAck<CallConsumeResult>) => void,
  ) => void;
  CALL_RESUME_CONSUMER: (payload: { consumerId: string }, ack: (result: CallAck<{ ok: true }>) => void) => void;
  CALL_LEAVE: () => void;
}

export interface SocketData {
  userId: string;
}
