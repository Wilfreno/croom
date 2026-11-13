import { ConversationModel } from '@repo/models';
import type { CallMember } from '@repo/types';
import type { Producer, WebRtcTransport } from 'mediasoup/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CallRouterEntry } from '../../types/mediasoup.type';
import { CallService } from './call.service';
import { MediasoupService } from './mediasoup.service';

// Keep the native mediasoup worker out of unit tests; CallService only needs releaseRouter.
vi.mock('./mediasoup.service', () => ({ MediasoupService: class {} }));

const CONVERSATION_ID = '64b7f0c2a1b2c3d4e5f60718';
const OTHER_CONVERSATION_ID = '64b7f0c2a1b2c3d4e5f60719';

const alice: CallMember = { id: '64b7f0c2a1b2c3d4e5f6071a', displayName: 'Alice', photoUrl: null };
const bob: CallMember = { id: '64b7f0c2a1b2c3d4e5f6071b', displayName: 'Bob', photoUrl: 'https://utfs.io/b' };

const routerEntry = {} as CallRouterEntry;

function build({ members = [alice, bob] as CallMember[] | null, isBlocked = false } = {}) {
  const conversationModel = {
    getCallMembersByConversationId: vi.fn().mockResolvedValue(members),
    isUserBlockedInConversation: vi.fn().mockResolvedValue(isBlocked),
  };
  const mediasoup = { releaseRouter: vi.fn().mockResolvedValue(undefined) };

  return {
    conversationModel,
    mediasoup,
    service: new CallService(
      conversationModel as unknown as ConversationModel,
      mediasoup as unknown as MediasoupService,
    ),
  };
}

function producer(id: string, kind: 'audio' | 'video', paused = false) {
  return { id, kind, paused } as Producer;
}

function transport() {
  return { close: vi.fn() } as unknown as WebRtcTransport & { close: ReturnType<typeof vi.fn> };
}

describe('CallService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('checkAccess', () => {
    it.each([undefined, 42, 'not-an-id'])('rejects a conversation id of %j without querying', async (id) => {
      const { service, conversationModel } = build();

      await expect(service.checkAccess(id, alice.id)).resolves.toEqual({ error: 'invalid conversation' });
      expect(conversationModel.getCallMembersByConversationId).not.toHaveBeenCalled();
    });

    it('returns the members and the caller for a member', async () => {
      const { service, conversationModel } = build();

      await expect(service.checkAccess(CONVERSATION_ID, bob.id)).resolves.toEqual({
        members: [alice, bob],
        caller: bob,
      });
      expect(conversationModel.isUserBlockedInConversation).toHaveBeenCalledWith({
        conversationId: CONVERSATION_ID,
        userId: bob.id,
      });
    });

    it('refuses a user who is blocked in the conversation', async () => {
      const { service } = build({ isBlocked: true });

      await expect(service.checkAccess(CONVERSATION_ID, alice.id)).resolves.toEqual({
        error: 'you cannot call this conversation',
      });
    });

    it('reports a conversation that does not exist', async () => {
      const { service } = build({ members: null });

      await expect(service.checkAccess(CONVERSATION_ID, alice.id)).resolves.toEqual({
        error: 'conversation not found',
      });
    });

    it('refuses a user who is not a member', async () => {
      const { service } = build({ members: [bob] });

      await expect(service.checkAccess(CONVERSATION_ID, alice.id)).resolves.toEqual({
        error: 'you are not a member on this conversation',
      });
    });
  });

  describe('peers and rooms', () => {
    it('adds a peer with empty producer and consumer maps', () => {
      const { service } = build();

      const peer = service.addPeer({ peerId: 's1', userId: alice.id, conversationId: CONVERSATION_ID, routerEntry });

      expect(peer.producers.size).toBe(0);
      expect(peer.consumers.size).toBe(0);
      expect(service.getPeer('s1')).toBe(peer);
    });

    it('lists the other peers in the same call only', () => {
      const { service } = build();
      service.addPeer({ peerId: 's1', userId: alice.id, conversationId: CONVERSATION_ID, routerEntry });
      const second = service.addPeer({ peerId: 's2', userId: bob.id, conversationId: CONVERSATION_ID, routerEntry });
      service.addPeer({ peerId: 's3', userId: bob.id, conversationId: OTHER_CONVERSATION_ID, routerEntry });

      expect(service.otherPeers(CONVERSATION_ID, 's1')).toEqual([second]);
    });

    it('treats two tabs of the same user as separate peers', () => {
      const { service } = build();
      service.addPeer({ peerId: 's1', userId: alice.id, conversationId: CONVERSATION_ID, routerEntry });
      const tab = service.addPeer({ peerId: 's2', userId: alice.id, conversationId: CONVERSATION_ID, routerEntry });

      expect(service.otherPeers(CONVERSATION_ID, 's1')).toEqual([tab]);
    });

    it('has no other peers in a call nobody joined', () => {
      const { service } = build();

      expect(service.otherPeers(CONVERSATION_ID, 's1')).toEqual([]);
    });
  });

  describe('producers', () => {
    it('describes every producer of the given peers', () => {
      const { service } = build();
      const a = service.addPeer({ peerId: 's1', userId: alice.id, conversationId: CONVERSATION_ID, routerEntry });
      const b = service.addPeer({ peerId: 's2', userId: bob.id, conversationId: CONVERSATION_ID, routerEntry });
      a.producers.set('p1', producer('p1', 'audio'));
      a.producers.set('p2', producer('p2', 'video', true));
      b.producers.set('p3', producer('p3', 'audio'));

      expect(service.producerInfos([a, b])).toEqual([
        { peerId: 's1', producerId: 'p1', kind: 'audio', paused: false },
        { peerId: 's1', producerId: 'p2', kind: 'video', paused: true },
        { peerId: 's2', producerId: 'p3', kind: 'audio', paused: false },
      ]);
    });

    it('finds a producer anywhere in the call, but not in another call', () => {
      const { service } = build();
      service.addPeer({ peerId: 's1', userId: alice.id, conversationId: CONVERSATION_ID, routerEntry });
      const b = service.addPeer({ peerId: 's2', userId: bob.id, conversationId: CONVERSATION_ID, routerEntry });
      const elsewhere = service.addPeer({
        peerId: 's3',
        userId: bob.id,
        conversationId: OTHER_CONVERSATION_ID,
        routerEntry,
      });
      const target = producer('p1', 'video');
      b.producers.set('p1', target);
      elsewhere.producers.set('p9', producer('p9', 'audio'));

      expect(service.findProducer(CONVERSATION_ID, 'p1')).toBe(target);
      expect(service.findProducer(CONVERSATION_ID, 'p9')).toBeUndefined();
      expect(service.findProducer(OTHER_CONVERSATION_ID, 'p1')).toBeUndefined();
    });
  });

  describe('removePeer', () => {
    it('returns undefined for a socket that is not in a call', async () => {
      const { service, mediasoup } = build();

      await expect(service.removePeer('nobody')).resolves.toBeUndefined();
      expect(mediasoup.releaseRouter).not.toHaveBeenCalled();
    });

    it('closes both transports, forgets the peer and releases its router', async () => {
      const { service, mediasoup } = build();
      const peer = service.addPeer({ peerId: 's1', userId: alice.id, conversationId: CONVERSATION_ID, routerEntry });
      const send = transport();
      const recv = transport();
      peer.sendTransport = send;
      peer.recvTransport = recv;

      await expect(service.removePeer('s1')).resolves.toBe(peer);

      expect(send.close).toHaveBeenCalledOnce();
      expect(recv.close).toHaveBeenCalledOnce();
      expect(service.getPeer('s1')).toBeUndefined();
      expect(mediasoup.releaseRouter).toHaveBeenCalledWith(CONVERSATION_ID, routerEntry);
    });

    it('copes with a peer that never created transports', async () => {
      const { service } = build();
      service.addPeer({ peerId: 's1', userId: alice.id, conversationId: CONVERSATION_ID, routerEntry });

      await expect(service.removePeer('s1')).resolves.toBeDefined();
    });

    it('keeps the room for the peers still in it', async () => {
      const { service } = build();
      service.addPeer({ peerId: 's1', userId: alice.id, conversationId: CONVERSATION_ID, routerEntry });
      const b = service.addPeer({ peerId: 's2', userId: bob.id, conversationId: CONVERSATION_ID, routerEntry });

      await service.removePeer('s1');

      expect(service.otherPeers(CONVERSATION_ID, 'someone-new')).toEqual([b]);
    });

    it('lets a fresh call start in a conversation whose last peer left', async () => {
      const { service } = build();
      service.addPeer({ peerId: 's1', userId: alice.id, conversationId: CONVERSATION_ID, routerEntry });
      await service.removePeer('s1');

      const rejoined = service.addPeer({ peerId: 's2', userId: bob.id, conversationId: CONVERSATION_ID, routerEntry });

      expect(service.otherPeers(CONVERSATION_ID, 's3')).toEqual([rejoined]);
    });
  });
});
