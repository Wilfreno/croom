import { Injectable } from '@nestjs/common';
import { ConversationModel } from '@repo/models';
import type { CallMember, CallPeer, CallProducerInfo } from '@repo/types';
import type { Consumer, Producer, WebRtcTransport } from 'mediasoup/types';
import { isValidObjectId } from 'mongoose';
import type { CallRouterEntry } from '../../types/mediasoup.type';
import { MediasoupService } from './mediasoup.service';

export interface Peer extends CallPeer {
  conversationId: string;
  /** The router this peer connects through; a big call can span several. */
  routerEntry: CallRouterEntry;
  sendTransport?: WebRtcTransport;
  recvTransport?: WebRtcTransport;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
}

type CallAccess =
  | { members: CallMember[]; caller: CallMember }
  | { error: string };

/**
 * In-memory state of every active call: which sockets (peers) are in which conversation,
 * and the mediasoup transports, producers and consumers each peer owns.
 *
 * State lives in this process only, so calls don't survive a restart and the server
 * can't be scaled horizontally without moving rooms to a shared store.
 */
@Injectable()
export class CallService {
  private readonly peers = new Map<string, Peer>(); // socket id → peer
  private readonly rooms = new Map<string, Set<string>>(); // conversation id → socket ids

  constructor(
    private readonly conversationModel: ConversationModel,
    private readonly mediasoup: MediasoupService,
  ) {}

  /** Resolves the conversation's members if `userId` belongs to it and may call it. */
  async checkAccess(
    conversationId: unknown,
    userId: string,
  ): Promise<CallAccess> {
    if (typeof conversationId !== 'string' || !isValidObjectId(conversationId))
      return { error: 'invalid conversation' };

    const [members, isBlocked] = await Promise.all([
      this.conversationModel.getCallMembersByConversationId(conversationId),
      this.conversationModel.isUserBlockedInConversation({
        conversationId,
        userId,
      }),
    ]);

    if (isBlocked) return { error: 'you cannot call this conversation' };
    if (!members) return { error: 'conversation not found' };

    const caller = members?.find((member) => member.id === userId);
    if (!caller) return { error: 'you are not a member on this conversation' };

    return { members, caller };
  }

  getPeer(peerId: string) {
    return this.peers.get(peerId);
  }

  addPeer(
    peer: CallPeer & { conversationId: string; routerEntry: CallRouterEntry },
  ): Peer {
    const newPeer: Peer = {
      ...peer,
      producers: new Map(),
      consumers: new Map(),
    };
    this.peers.set(peer.peerId, newPeer);

    const room = this.rooms.get(peer.conversationId) ?? new Set<string>();
    room.add(peer.peerId);
    this.rooms.set(peer.conversationId, room);
    return newPeer;
  }

  /** Every other peer in the conversation's call. */
  otherPeers(conversationId: string, peerId: string): Peer[] {
    return [...(this.rooms.get(conversationId) ?? [])]
      .filter((id) => id !== peerId)
      .map((id) => this.peers.get(id))
      .filter((peer): peer is Peer => Boolean(peer));
  }

  producerInfos(peers: Peer[]): CallProducerInfo[] {
    return peers.flatMap((peer) =>
      [...peer.producers.values()].map((producer) => ({
        peerId: peer.peerId,
        producerId: producer.id,
        kind: producer.kind,
        paused: producer.paused,
      })),
    );
  }

  /** Finds a producer anywhere in the conversation's call. */
  findProducer(conversationId: string, producerId: string) {
    for (const peerId of this.rooms.get(conversationId) ?? []) {
      const producer = this.peers.get(peerId)?.producers.get(producerId);
      if (producer) return producer;
    }
    return undefined;
  }

  /**
   * Removes the peer and closes its transports, which closes its producers and consumers too.
   * Consumers of its producers on other peers close as well and fire `producerclose`.
   * Returns the removed peer, or undefined if the socket wasn't in a call.
   */
  async removePeer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (!peer) return undefined;

    this.peers.delete(peerId);
    peer.sendTransport?.close();
    peer.recvTransport?.close();

    const room = this.rooms.get(peer.conversationId);
    room?.delete(peerId);
    if (room && room.size === 0) this.rooms.delete(peer.conversationId);

    await this.mediasoup.releaseRouter(peer.conversationId, peer.routerEntry);
    return peer;
  }
}
