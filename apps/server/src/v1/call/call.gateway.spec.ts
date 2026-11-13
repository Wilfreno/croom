import { ConversationModel } from '@repo/models';
import type { CallMember } from '@repo/types';
import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TypedServer, TypedSocket } from '../../common/types/socket-io.types';
import type { CallRouterEntry } from '../../types/mediasoup.type';
import { CallGateway } from './call.gateway';
import { CallService } from './call.service';
import { MediasoupService } from './mediasoup.service';

// Keep the native mediasoup worker out of unit tests.
vi.mock('./mediasoup.service', () => ({ MediasoupService: class {} }));

const CONVERSATION_ID = '64b7f0c2a1b2c3d4e5f60718';
const OTHER_CONVERSATION_ID = '64b7f0c2a1b2c3d4e5f60719';

const alice: CallMember = { id: 'alice', displayName: 'Alice', photoUrl: null };
const bob: CallMember = { id: 'bob', displayName: 'Bob', photoUrl: null };
const carol: CallMember = { id: 'carol', displayName: 'Carol', photoUrl: null };

/* ---------- fakes ---------- */

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${++idCounter}`;

function fakeProducer(kind: 'audio' | 'video', paused: boolean) {
  return Object.assign(new EventEmitter(), {
    id: nextId('producer'),
    kind,
    paused,
    pause: vi.fn(async () => undefined),
    resume: vi.fn(async () => undefined),
  });
}

function fakeConsumer(producerId: string) {
  return Object.assign(new EventEmitter(), {
    id: nextId('consumer'),
    producerId,
    kind: 'video' as const,
    rtpParameters: { codecs: [] },
    producerPaused: false,
    resume: vi.fn(async () => undefined),
  });
}

function fakeTransport() {
  return {
    id: nextId('transport'),
    iceParameters: { usernameFragment: 'u' },
    iceCandidates: [{ ip: '127.0.0.1' }],
    dtlsParameters: { role: 'auto' },
    close: vi.fn(),
    connect: vi.fn(async () => undefined),
    produce: vi.fn(async ({ kind, paused }: { kind: 'audio' | 'video'; paused: boolean }) => fakeProducer(kind, paused)),
    consume: vi.fn(async ({ producerId }: { producerId: string }) => fakeConsumer(producerId)),
  };
}

function fakeRouterEntry(): CallRouterEntry {
  return {
    router: { rtpCapabilities: { codecs: ['opus'] }, canConsume: vi.fn(() => true) },
    workerEntry: {},
    peerCount: 0,
  } as unknown as CallRouterEntry;
}

/** A connected socket for `userId`; `emitted` collects what it was sent, `broadcast` what it sent to its rooms. */
function fakeClient(userId: string | undefined, id = nextId('socket')) {
  const broadcast = { emit: vi.fn() };
  const client = {
    id,
    data: { userId },
    emit: vi.fn(),
    to: vi.fn(() => broadcast),
    join: vi.fn(async () => undefined),
    leave: vi.fn(async () => undefined),
  };
  return { client: client as unknown as TypedSocket, spies: client, broadcast };
}

function build({ members = [alice, bob] as CallMember[] | null, isBlocked = false } = {}) {
  const conversationModel = {
    getCallMembersByConversationId: vi.fn().mockResolvedValue(members),
    isUserBlockedInConversation: vi.fn().mockResolvedValue(isBlocked),
  };
  const routerEntry = fakeRouterEntry();
  const mediasoup = {
    assignRouter: vi.fn(async () => routerEntry),
    releaseRouter: vi.fn(async () => undefined),
    shareProducer: vi.fn(async () => undefined),
    createWebRtcTransport: vi.fn(async () => fakeTransport()),
  };
  const callService = new CallService(
    conversationModel as unknown as ConversationModel,
    mediasoup as unknown as MediasoupService,
  );
  const gateway = new CallGateway(callService, mediasoup as unknown as MediasoupService);
  const roomEmit = vi.fn();
  const server = { to: vi.fn(() => ({ emit: roomEmit })) };
  gateway.server = server as unknown as TypedServer;

  return { gateway, callService, mediasoup, conversationModel, routerEntry, server, roomEmit };
}

/** Joins `client` to the call and gives it both transports. */
async function joinWithTransports(gateway: CallGateway, client: TypedSocket) {
  await gateway.join(client, { conversationId: CONVERSATION_ID });
  await gateway.createTransport(client, { direction: 'send' });
  await gateway.createTransport(client, { direction: 'recv' });
}

beforeEach(() => {
  vi.clearAllMocks();
  idCounter = 0;
});

/* ---------- tests ---------- */

describe('CallGateway', () => {
  describe('CALL (ringing)', () => {
    it('rings every other member of the conversation', async () => {
      const { gateway, server, roomEmit } = build({ members: [alice, bob, carol] });
      const { client } = fakeClient('alice');

      await gateway.handleCall(client, { conversationId: CONVERSATION_ID });

      expect(server.to).toHaveBeenCalledWith(['bob', 'carol']);
      expect(roomEmit).toHaveBeenCalledWith('INCOMING_CALL', { conversationId: CONVERSATION_ID, caller: alice });
    });

    it('rings nobody when the caller is the only member', async () => {
      const { gateway, server } = build({ members: [alice] });

      await gateway.handleCall(fakeClient('alice').client, { conversationId: CONVERSATION_ID });

      expect(server.to).not.toHaveBeenCalled();
    });

    it('tells the caller why they cannot call', async () => {
      const { gateway, server } = build({ isBlocked: true });
      const { client, spies } = fakeClient('alice');

      await gateway.handleCall(client, { conversationId: CONVERSATION_ID });

      expect(spies.emit).toHaveBeenCalledWith('ERROR', 'you cannot call this conversation');
      expect(server.to).not.toHaveBeenCalled();
    });

    it('ignores a socket without a user', async () => {
      const { gateway, conversationModel } = build();

      await gateway.handleCall(fakeClient(undefined).client, { conversationId: CONVERSATION_ID });

      expect(conversationModel.getCallMembersByConversationId).not.toHaveBeenCalled();
    });

    it('reports an unexpected failure', async () => {
      const { gateway, conversationModel } = build();
      conversationModel.getCallMembersByConversationId.mockRejectedValue(new Error('db down'));
      const { client, spies } = fakeClient('alice');

      await gateway.handleCall(client, { conversationId: CONVERSATION_ID });

      expect(spies.emit).toHaveBeenCalledWith('ERROR', 'could not start the call');
    });
  });

  describe('CALL_JOIN', () => {
    it('refuses a socket without a user', async () => {
      const { gateway } = build();

      await expect(gateway.join(fakeClient(undefined).client, { conversationId: CONVERSATION_ID })).resolves.toEqual({
        error: 'you are not logged in',
      });
    });

    it('refuses someone who may not join', async () => {
      const { gateway, mediasoup } = build({ members: [bob] });

      await expect(gateway.join(fakeClient('alice').client, { conversationId: CONVERSATION_ID })).resolves.toEqual({
        error: 'you are not a member on this conversation',
      });
      expect(mediasoup.assignRouter).not.toHaveBeenCalled();
    });

    it('joins the first person: router capabilities, members, and an empty call', async () => {
      const { gateway, mediasoup } = build();
      const { client, spies, broadcast } = fakeClient('alice');

      const result = await gateway.join(client, { conversationId: CONVERSATION_ID });

      expect(result).toEqual({ rtpCapabilities: { codecs: ['opus'] }, members: [alice, bob], peers: [], producers: [] });
      expect(mediasoup.assignRouter).toHaveBeenCalledWith(CONVERSATION_ID);
      expect(spies.join).toHaveBeenCalledWith(`call:${CONVERSATION_ID}`);
      expect(broadcast.emit).toHaveBeenCalledWith('CALL_PEER_JOINED', { peerId: client.id, userId: 'alice' });
    });

    it('tells a later joiner who is there and what they are sending', async () => {
      const { gateway } = build();
      const first = fakeClient('alice');
      await joinWithTransports(gateway, first.client);
      const produced = await gateway.produce(first.client, { kind: 'video', rtpParameters: {} });

      const result = await gateway.join(fakeClient('bob').client, { conversationId: CONVERSATION_ID });

      expect(result).toMatchObject({
        peers: [{ peerId: first.client.id, userId: 'alice' }],
        producers: [{ peerId: first.client.id, producerId: (produced as { id: string }).id, kind: 'video', paused: false }],
      });
    });

    it('leaves a previous call before joining another', async () => {
      const { gateway, mediasoup, server, roomEmit } = build();
      const { client, spies } = fakeClient('alice');
      await gateway.join(client, { conversationId: OTHER_CONVERSATION_ID });

      await gateway.join(client, { conversationId: CONVERSATION_ID });

      expect(mediasoup.releaseRouter).toHaveBeenCalledWith(OTHER_CONVERSATION_ID, expect.anything());
      expect(spies.leave).toHaveBeenCalledWith(`call:${OTHER_CONVERSATION_ID}`);
      expect(server.to).toHaveBeenCalledWith(`call:${OTHER_CONVERSATION_ID}`);
      expect(roomEmit).toHaveBeenCalledWith('CALL_PEER_LEFT', { peerId: client.id });
    });

    it('answers with a generic error when something breaks', async () => {
      const { gateway, mediasoup } = build();
      mediasoup.assignRouter.mockRejectedValue(new Error('no workers'));

      await expect(gateway.join(fakeClient('alice').client, { conversationId: CONVERSATION_ID })).resolves.toEqual({
        error: 'call request failed',
      });
    });
  });

  describe('CALL_CREATE_TRANSPORT', () => {
    it('needs the socket to be in a call', async () => {
      const { gateway } = build();

      await expect(gateway.createTransport(fakeClient('alice').client, { direction: 'send' })).resolves.toEqual({
        error: 'not in a call',
      });
    });

    it('rejects an invalid direction without creating anything', async () => {
      const { gateway, mediasoup } = build();
      const { client } = fakeClient('alice');
      await gateway.join(client, { conversationId: CONVERSATION_ID });

      await expect(gateway.createTransport(client, { direction: 'sideways' as never })).resolves.toEqual({
        error: 'invalid direction',
      });
      expect(mediasoup.createWebRtcTransport).not.toHaveBeenCalled();
    });

    it("returns the transport's connection parameters", async () => {
      const { gateway, routerEntry, mediasoup } = build();
      const { client } = fakeClient('alice');
      await gateway.join(client, { conversationId: CONVERSATION_ID });

      const result = await gateway.createTransport(client, { direction: 'recv' });

      expect(mediasoup.createWebRtcTransport).toHaveBeenCalledWith(routerEntry);
      expect(result).toEqual({
        id: expect.stringMatching(/^transport-/),
        iceParameters: { usernameFragment: 'u' },
        iceCandidates: [{ ip: '127.0.0.1' }],
        dtlsParameters: { role: 'auto' },
      });
    });

    it('closes the old transport when one is replaced', async () => {
      const { gateway, callService } = build();
      const { client } = fakeClient('alice');
      await gateway.join(client, { conversationId: CONVERSATION_ID });
      await gateway.createTransport(client, { direction: 'send' });
      const old = callService.getPeer(client.id)!.sendTransport!;

      await gateway.createTransport(client, { direction: 'send' });

      expect(old.close).toHaveBeenCalled();
      expect(callService.getPeer(client.id)!.sendTransport).not.toBe(old);
    });
  });

  describe('CALL_CONNECT_TRANSPORT', () => {
    it('connects one of the socket’s own transports', async () => {
      const { gateway, callService } = build();
      const { client } = fakeClient('alice');
      await joinWithTransports(gateway, client);
      const transport = callService.getPeer(client.id)!.recvTransport!;

      await expect(
        gateway.connectTransport(client, { transportId: transport.id, dtlsParameters: { role: 'client' } }),
      ).resolves.toEqual({ ok: true });
      expect(transport.connect).toHaveBeenCalledWith({ dtlsParameters: { role: 'client' } });
    });

    it('refuses a transport it does not own', async () => {
      const { gateway } = build();
      const { client } = fakeClient('alice');
      await joinWithTransports(gateway, client);

      await expect(gateway.connectTransport(client, { transportId: 'someone-elses', dtlsParameters: {} })).resolves.toEqual({
        error: 'transport not found',
      });
    });
  });

  describe('CALL_PRODUCE', () => {
    it('needs a send transport', async () => {
      const { gateway } = build();
      const { client } = fakeClient('alice');
      await gateway.join(client, { conversationId: CONVERSATION_ID });

      await expect(gateway.produce(client, { kind: 'audio', rtpParameters: {} })).resolves.toEqual({
        error: 'no send transport',
      });
    });

    it('rejects an invalid kind', async () => {
      const { gateway } = build();
      const { client } = fakeClient('alice');
      await joinWithTransports(gateway, client);

      await expect(gateway.produce(client, { kind: 'smell' as never, rtpParameters: {} })).resolves.toEqual({
        error: 'invalid kind',
      });
    });

    it('shares the feed across routers before telling the others it exists', async () => {
      const { gateway, mediasoup, routerEntry } = build();
      const { client, broadcast } = fakeClient('alice');
      await joinWithTransports(gateway, client);
      broadcast.emit.mockClear();

      const result = await gateway.produce(client, { kind: 'video', rtpParameters: {}, paused: true });

      const { id } = result as { id: string };
      expect(mediasoup.shareProducer).toHaveBeenCalledWith(CONVERSATION_ID, routerEntry, expect.objectContaining({ id }));
      expect(broadcast.emit).toHaveBeenCalledWith('CALL_NEW_PRODUCER', {
        peerId: client.id,
        producerId: id,
        kind: 'video',
        paused: true,
      });
      expect(mediasoup.shareProducer.mock.invocationCallOrder[0]).toBeLessThan(broadcast.emit.mock.invocationCallOrder[0]);
    });

    it('forgets a producer whose transport closed', async () => {
      const { gateway, callService } = build();
      const { client } = fakeClient('alice');
      await joinWithTransports(gateway, client);
      const { id } = (await gateway.produce(client, { kind: 'audio', rtpParameters: {} })) as { id: string };
      const producer = callService.getPeer(client.id)!.producers.get(id)! as unknown as EventEmitter;

      producer.emit('transportclose');

      expect(callService.getPeer(client.id)!.producers.has(id)).toBe(false);
    });
  });

  describe('CALL_SET_PRODUCER_PAUSED', () => {
    it('pauses and resumes your own producer', async () => {
      const { gateway, callService } = build();
      const { client } = fakeClient('alice');
      await joinWithTransports(gateway, client);
      const { id } = (await gateway.produce(client, { kind: 'audio', rtpParameters: {} })) as { id: string };
      const producer = callService.getPeer(client.id)!.producers.get(id)!;

      await expect(gateway.setProducerPaused(client, { producerId: id, paused: true })).resolves.toEqual({ ok: true });
      expect(producer.pause).toHaveBeenCalled();

      await gateway.setProducerPaused(client, { producerId: id, paused: false });
      expect(producer.resume).toHaveBeenCalled();
    });

    it("refuses someone else's producer", async () => {
      const { gateway } = build();
      const owner = fakeClient('alice');
      await joinWithTransports(gateway, owner.client);
      const { id } = (await gateway.produce(owner.client, { kind: 'audio', rtpParameters: {} })) as { id: string };
      const other = fakeClient('bob');
      await gateway.join(other.client, { conversationId: CONVERSATION_ID });

      await expect(gateway.setProducerPaused(other.client, { producerId: id, paused: true })).resolves.toEqual({
        error: 'producer not found',
      });
    });
  });

  describe('CALL_CONSUME and CALL_RESUME_CONSUMER', () => {
    async function twoPeople() {
      const setup = build();
      const sender = fakeClient('alice');
      const receiver = fakeClient('bob');
      await joinWithTransports(setup.gateway, sender.client);
      await joinWithTransports(setup.gateway, receiver.client);
      const { id: producerId } = (await setup.gateway.produce(sender.client, { kind: 'video', rtpParameters: {} })) as {
        id: string;
      };
      return { ...setup, sender, receiver, producerId };
    }

    it('needs a receive transport', async () => {
      const { gateway } = build();
      const { client } = fakeClient('alice');
      await gateway.join(client, { conversationId: CONVERSATION_ID });

      await expect(gateway.consume(client, { producerId: 'p', rtpCapabilities: {} })).resolves.toEqual({
        error: 'no receive transport',
      });
    });

    it('refuses a producer that is not in this call', async () => {
      const { gateway, receiver } = await twoPeople();

      await expect(gateway.consume(receiver.client, { producerId: 'elsewhere', rtpCapabilities: {} })).resolves.toEqual({
        error: 'cannot consume this producer',
      });
    });

    it("refuses a producer the receiver's device cannot decode", async () => {
      const { gateway, receiver, producerId, routerEntry } = await twoPeople();
      vi.mocked(routerEntry.router.canConsume).mockReturnValue(false);

      await expect(gateway.consume(receiver.client, { producerId, rtpCapabilities: {} })).resolves.toEqual({
        error: 'cannot consume this producer',
      });
    });

    it('consumes paused, so the client can resume once ready', async () => {
      const { gateway, receiver, producerId, callService } = await twoPeople();

      const result = await gateway.consume(receiver.client, { producerId, rtpCapabilities: { codecs: [] } });

      const transport = callService.getPeer(receiver.client.id)!.recvTransport!;
      expect(transport.consume).toHaveBeenCalledWith({ producerId, rtpCapabilities: { codecs: [] }, paused: true });
      expect(result).toEqual({
        id: expect.stringMatching(/^consumer-/),
        producerId,
        kind: 'video',
        rtpParameters: { codecs: [] },
        producerPaused: false,
      });
    });

    it('resumes your own consumer, and only yours', async () => {
      const { gateway, receiver, sender, producerId, callService } = await twoPeople();
      const { id } = (await gateway.consume(receiver.client, { producerId, rtpCapabilities: {} })) as { id: string };

      await expect(gateway.resumeConsumer(sender.client, { consumerId: id })).resolves.toEqual({ error: 'consumer not found' });
      await expect(gateway.resumeConsumer(receiver.client, { consumerId: id })).resolves.toEqual({ ok: true });
      expect(callService.getPeer(receiver.client.id)!.consumers.get(id)!.resume).toHaveBeenCalled();
    });

    it('relays the producer pausing, resuming and closing to the receiver', async () => {
      const { gateway, receiver, producerId, callService } = await twoPeople();
      const { id } = (await gateway.consume(receiver.client, { producerId, rtpCapabilities: {} })) as { id: string };
      const consumer = callService.getPeer(receiver.client.id)!.consumers.get(id)! as unknown as EventEmitter;

      consumer.emit('producerpause');
      expect(receiver.spies.emit).toHaveBeenCalledWith('CALL_PRODUCER_PAUSED', { producerId, paused: true });

      consumer.emit('producerresume');
      expect(receiver.spies.emit).toHaveBeenCalledWith('CALL_PRODUCER_PAUSED', { producerId, paused: false });

      consumer.emit('producerclose');
      expect(receiver.spies.emit).toHaveBeenCalledWith('CALL_PRODUCER_CLOSED', { producerId });
      expect(callService.getPeer(receiver.client.id)!.consumers.has(id)).toBe(false);
    });

    it('forgets a consumer whose transport closed', async () => {
      const { gateway, receiver, producerId, callService } = await twoPeople();
      const { id } = (await gateway.consume(receiver.client, { producerId, rtpCapabilities: {} })) as { id: string };

      (callService.getPeer(receiver.client.id)!.consumers.get(id)! as unknown as EventEmitter).emit('transportclose');

      expect(callService.getPeer(receiver.client.id)!.consumers.has(id)).toBe(false);
    });
  });

  describe('leaving', () => {
    it.each([
      ['CALL_LEAVE', (gateway: CallGateway, client: TypedSocket) => gateway.handleLeave(client)],
      ['disconnecting', (gateway: CallGateway, client: TypedSocket) => gateway.handleDisconnect(client)],
    ])('%s removes the peer and tells the room', async (_, leave) => {
      const { gateway, callService, mediasoup, server, roomEmit } = build();
      const { client, spies } = fakeClient('alice');
      await joinWithTransports(gateway, client);
      const peer = callService.getPeer(client.id)!;

      await leave(gateway, client);

      expect(callService.getPeer(client.id)).toBeUndefined();
      expect(peer.sendTransport!.close).toHaveBeenCalled();
      expect(mediasoup.releaseRouter).toHaveBeenCalled();
      expect(spies.leave).toHaveBeenCalledWith(`call:${CONVERSATION_ID}`);
      expect(server.to).toHaveBeenCalledWith(`call:${CONVERSATION_ID}`);
      expect(roomEmit).toHaveBeenCalledWith('CALL_PEER_LEFT', { peerId: client.id });
    });

    it('does nothing for a socket that was not in a call', async () => {
      const { gateway, server } = build();

      await gateway.handleDisconnect(fakeClient('alice').client);

      expect(server.to).not.toHaveBeenCalled();
    });

    it('swallows a failure while leaving, so disconnects never throw', async () => {
      const { gateway, mediasoup } = build();
      const { client } = fakeClient('alice');
      await gateway.join(client, { conversationId: CONVERSATION_ID });
      mediasoup.releaseRouter.mockRejectedValue(new Error('router gone'));

      await expect(gateway.handleDisconnect(client)).resolves.toBeUndefined();
    });
  });
});
