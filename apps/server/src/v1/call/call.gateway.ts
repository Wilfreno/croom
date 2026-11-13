import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type {
  CallAck,
  CallConsumeResult,
  CallJoinResult,
  CallPayload,
  CallTransportOptions,
  MediaKind,
  MediasoupJson,
} from '@repo/types';
import type {
  Consumer,
  DtlsParameters,
  RtpCapabilities,
  RtpParameters,
} from 'mediasoup/types';
import type {
  TypedServer,
  TypedSocket,
} from '../../common/types/socket-io.types';
import { CallService, Peer } from './call.service';
import { MediasoupService } from './mediasoup.service';

const callRoom = (conversationId: string) => `call:${conversationId}`;

@WebSocketGateway({ namespace: '/io' })
export class CallGateway implements OnGatewayDisconnect {
  private readonly logger = new Logger(CallGateway.name);

  @WebSocketServer()
  server!: TypedServer;

  constructor(
    private readonly callService: CallService,
    private readonly mediasoup: MediasoupService,
  ) {}

  async handleDisconnect(client: TypedSocket) {
    await this.leave(client);
  }

  /** Rings every other member of a conversation the caller belongs to. */
  @SubscribeMessage('CALL')
  async handleCall(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: CallPayload,
  ) {
    const callerId = client.data.userId;
    if (!callerId) return;

    try {
      const access = await this.callService.checkAccess(
        payload?.conversationId,
        callerId,
      );
      if ('error' in access) {
        client.emit('ERROR', access.error);
        return;
      }

      const recipientIds = access.members
        .map((member) => member.id)
        .filter((memberId) => memberId !== callerId);
      if (!recipientIds.length) return;

      this.server.to(recipientIds).emit('INCOMING_CALL', {
        conversationId: payload.conversationId,
        caller: access.caller,
      });
    } catch (error) {
      this.logger.error(error);
      client.emit('ERROR', 'could not start the call');
    }
  }

  @SubscribeMessage('CALL_JOIN')
  join(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: CallPayload,
  ): Promise<CallAck<CallJoinResult>> {
    return this.handle(async () => {
      const userId = client.data.userId;
      const { conversationId } = payload;
      if (!userId) return { error: 'you are not logged in' };

      const access = await this.callService.checkAccess(conversationId, userId);
      if ('error' in access) return access;

      // A socket is in at most one call at a time.
      await this.leave(client);

      const routerEntry = await this.mediasoup.assignRouter(conversationId);
      const otherPeers = this.callService.otherPeers(conversationId, client.id);
      this.callService.addPeer({
        peerId: client.id,
        userId,
        conversationId,
        routerEntry,
      });

      client
        .to(callRoom(conversationId))
        .emit('CALL_PEER_JOINED', { peerId: client.id, userId });
      await client.join(callRoom(conversationId));

      return {
        // Every router of a call has the same codecs, so any of them answers this.
        rtpCapabilities: routerEntry.router.rtpCapabilities,
        members: access.members,
        peers: otherPeers.map(({ peerId, userId }) => ({ peerId, userId })),
        producers: this.callService.producerInfos(otherPeers),
      };
    });
  }

  @SubscribeMessage('CALL_CREATE_TRANSPORT')
  createTransport(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: { direction: 'send' | 'recv' },
  ): Promise<CallAck<CallTransportOptions>> {
    return this.handle(async () => {
      const peer = this.callService.getPeer(client.id);
      if (!peer) return { error: 'not in a call' };
      // Checked before creating anything, so a bad request can't leave a transport behind.
      const direction = payload?.direction;
      if (direction !== 'send' && direction !== 'recv')
        return { error: 'invalid direction' };

      const transport = await this.mediasoup.createWebRtcTransport(
        peer.routerEntry,
      );
      if (direction === 'send') {
        peer.sendTransport?.close();
        peer.sendTransport = transport;
      } else {
        peer.recvTransport?.close();
        peer.recvTransport = transport;
      }

      return {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      };
    });
  }

  @SubscribeMessage('CALL_CONNECT_TRANSPORT')
  connectTransport(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody()
    payload: { transportId: string; dtlsParameters: MediasoupJson },
  ): Promise<CallAck<{ ok: true }>> {
    return this.handle(async () => {
      const peer = this.callService.getPeer(client.id);
      const transport = [peer?.sendTransport, peer?.recvTransport].find(
        (candidate) => candidate?.id === payload?.transportId,
      );
      if (!transport) return { error: 'transport not found' };

      await transport.connect({
        dtlsParameters: payload.dtlsParameters as DtlsParameters,
      });
      return { ok: true };
    });
  }

  @SubscribeMessage('CALL_PRODUCE')
  produce(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody()
    payload: {
      kind: MediaKind;
      rtpParameters: MediasoupJson;
      paused?: boolean;
    },
  ): Promise<CallAck<{ id: string }>> {
    return this.handle(async () => {
      const peer = this.callService.getPeer(client.id);
      if (!peer?.sendTransport) return { error: 'no send transport' };
      if (payload?.kind !== 'audio' && payload?.kind !== 'video')
        return { error: 'invalid kind' };

      const producer = await peer.sendTransport.produce({
        kind: payload.kind,
        rtpParameters: payload.rtpParameters as RtpParameters,
        paused: Boolean(payload.paused),
      });
      peer.producers.set(producer.id, producer);
      producer.on('transportclose', () => peer.producers.delete(producer.id));
      // Pipe it to the call's other routers before anyone is told it exists.
      await this.mediasoup.shareProducer(
        peer.conversationId,
        peer.routerEntry,
        producer,
      );

      client.to(callRoom(peer.conversationId)).emit('CALL_NEW_PRODUCER', {
        peerId: peer.peerId,
        producerId: producer.id,
        kind: payload.kind,
        paused: producer.paused,
      });
      return { id: producer.id };
    });
  }

  /** Pausing a producer fires `producerpause` on every consumer of it, which tells their clients. */
  @SubscribeMessage('CALL_SET_PRODUCER_PAUSED')
  setProducerPaused(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: { producerId: string; paused: boolean },
  ): Promise<CallAck<{ ok: true }>> {
    return this.handle(async () => {
      const producer = this.callService
        .getPeer(client.id)
        ?.producers.get(payload?.producerId);
      if (!producer) return { error: 'producer not found' };

      if (payload.paused) await producer.pause();
      else await producer.resume();
      return { ok: true };
    });
  }

  @SubscribeMessage('CALL_CONSUME')
  consume(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody()
    payload: { producerId: string; rtpCapabilities: MediasoupJson },
  ): Promise<CallAck<CallConsumeResult>> {
    return this.handle(async () => {
      const peer = this.callService.getPeer(client.id);
      if (!peer?.recvTransport) return { error: 'no receive transport' };

      const producerId = payload?.producerId;
      const rtpCapabilities = payload?.rtpCapabilities as RtpCapabilities;
      const router = peer.routerEntry.router;
      if (
        !this.callService.findProducer(peer.conversationId, producerId) ||
        !router.canConsume({ producerId, rtpCapabilities })
      )
        return { error: 'cannot consume this producer' };

      // Start paused; the client resumes once its consumer is set up, so no keyframe is lost.
      const consumer = await peer.recvTransport.consume({
        producerId,
        rtpCapabilities,
        paused: true,
      });
      this.trackConsumer(client, peer, consumer);

      return {
        id: consumer.id,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        producerPaused: consumer.producerPaused,
      };
    });
  }

  @SubscribeMessage('CALL_RESUME_CONSUMER')
  resumeConsumer(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: { consumerId: string },
  ): Promise<CallAck<{ ok: true }>> {
    return this.handle(async () => {
      const consumer = this.callService
        .getPeer(client.id)
        ?.consumers.get(payload?.consumerId);
      if (!consumer) return { error: 'consumer not found' };

      await consumer.resume();
      return { ok: true };
    });
  }

  @SubscribeMessage('CALL_LEAVE')
  async handleLeave(@ConnectedSocket() client: TypedSocket) {
    await this.leave(client);
  }

  private trackConsumer(client: TypedSocket, peer: Peer, consumer: Consumer) {
    const producerId = consumer.producerId;
    peer.consumers.set(consumer.id, consumer);

    consumer.on('transportclose', () => peer.consumers.delete(consumer.id));
    consumer.on('producerclose', () => {
      peer.consumers.delete(consumer.id);
      client.emit('CALL_PRODUCER_CLOSED', { producerId });
    });
    consumer.on('producerpause', () =>
      client.emit('CALL_PRODUCER_PAUSED', { producerId, paused: true }),
    );
    consumer.on('producerresume', () =>
      client.emit('CALL_PRODUCER_PAUSED', { producerId, paused: false }),
    );
  }

  private async leave(client: TypedSocket) {
    try {
      const peer = await this.callService.removePeer(client.id);
      if (!peer) return;

      const room = callRoom(peer.conversationId);
      await client.leave(room);
      this.server.to(room).emit('CALL_PEER_LEFT', { peerId: peer.peerId });
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async handle<T>(
    handler: () => Promise<CallAck<T>>,
  ): Promise<CallAck<T>> {
    try {
      return await handler();
    } catch (error) {
      this.logger.error(error);
      return { error: 'call request failed' };
    }
  }
}
