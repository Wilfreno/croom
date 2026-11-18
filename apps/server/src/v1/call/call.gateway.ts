import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessageNoticeType } from '@repo/enums';
import type {
  CallAcceptResult,
  CallAck,
  CallCancelResult,
  CallConsumeResult,
  CallJoinResult,
  CallPayload,
  CallStartResult,
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
import { CallNoticeService } from './call-notice.service';
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
    private readonly callNotices: CallNoticeService,
  ) {}

  async handleDisconnect(client: TypedSocket) {
    await this.stopRingsCalledFrom(client);
    await this.leave(client);
  }

  /** Rings every other member of a conversation the caller belongs to. */
  @SubscribeMessage('CALL')
  async handleCall(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: CallPayload,
  ): Promise<CallAck<CallStartResult>> {
    const callerId = client.data.userId;
    if (!callerId) return { error: 'you are not logged in' };

    try {
      const access = await this.callService.checkAccess(
        payload?.conversationId,
        callerId,
      );
      if ('error' in access) {
        client.emit('ERROR', access.error);
        return access;
      }

      const pendingRing = this.callService.pendingRing(payload.conversationId);
      if (pendingRing && pendingRing.callerId !== callerId) {
        this.callService.answerRing(payload.conversationId);
        client
          .to(access.members.map((member) => member.id))
          .emit('CALL_ACCEPTED', {
            conversationId: payload.conversationId,
            userId: callerId,
          });
        return { isOngoing: true, ringingCount: 0 };
      }

      const isOngoing =
        this.callService.otherPeers(payload.conversationId, client.id).length >
        0;
      const userIdsInCall = this.callService.userIdsInCall(
        payload.conversationId,
      );
      const recipientIds = access.members
        .map((member) => member.id)
        .filter(
          (memberId) => memberId !== callerId && !userIdsInCall.has(memberId),
        );
      if (recipientIds.length)
        this.server.to(recipientIds).emit('INCOMING_CALL', {
          conversationId: payload.conversationId,
          caller: access.caller,
        });
      if (!isOngoing && recipientIds.length)
        this.callService.startRing(payload.conversationId, {
          callerId,
          callerSocketId: client.id,
          ringingUserIds: new Set(recipientIds),
        });
      if (!isOngoing)
        await this.callNotices.post({
          conversationId: payload.conversationId,
          userId: callerId,
          type: MessageNoticeType.CALL_RING,
        });

      return { isOngoing, ringingCount: recipientIds.length };
    } catch (error) {
      this.logger.error(error);
      client.emit('ERROR', 'could not start the call');
      return { error: 'could not start the call' };
    }
  }

  @SubscribeMessage('CALL_ACCEPT')
  async handleAccept(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: CallPayload,
  ): Promise<CallAck<CallAcceptResult>> {
    const memberIds = await this.memberIdsFor(client, payload);
    if (!memberIds) return { error: 'you cannot answer this call' };

    const isAccepted = this.callService.answerRing(payload.conversationId);
    if (isAccepted)
      this.relayAnswer(client, payload, memberIds, 'CALL_ACCEPTED');
    return { isAccepted };
  }

  @SubscribeMessage('CALL_DECLINE')
  async handleDecline(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: CallPayload,
  ) {
    const userId = client.data.userId;
    const memberIds = await this.memberIdsFor(client, payload);
    if (!userId || !memberIds) return;

    this.relayAnswer(client, payload, memberIds, 'CALL_DECLINED');
    this.callService.declineRing(payload.conversationId, userId);
  }

  @SubscribeMessage('CALL_CANCEL')
  async handleCancel(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: CallPayload,
  ): Promise<CallAck<CallCancelResult>> {
    const userId = client.data.userId;
    const memberIds = await this.memberIdsFor(client, payload);
    if (!userId || !memberIds) return { error: 'you cannot cancel this call' };

    const outcome = await this.stopRing(
      payload.conversationId,
      userId,
      memberIds,
    );
    return { isAnswered: outcome === 'answered' };
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
      this.callService.clearAnsweredRing(conversationId);

      client
        .to(callRoom(conversationId))
        .emit('CALL_PEER_JOINED', { peerId: client.id, userId });
      await client.join(callRoom(conversationId));

      const accessAfterJoin = await this.callService.checkAccess(
        conversationId,
        userId,
      );
      if ('error' in accessAfterJoin) {
        await this.leave(client);
        return accessAfterJoin;
      }

      if (this.callService.startIfConnected(conversationId))
        await this.callNotices.post({
          conversationId,
          userId,
          type: MessageNoticeType.CALL_STARTED,
        });

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

  async endCall(conversationId: string, reason: string) {
    try {
      const ring = this.callService.clearRing(conversationId);
      if (ring && !ring.isAnswered)
        this.server
          .to([ring.callerId, ...ring.ringingUserIds])
          .emit('CALL_CANCELLED', { conversationId });
      const ended = await this.callService.endRoom(conversationId);
      if (!ended.length) return;

      const room = callRoom(conversationId);
      this.server.to(room).emit('CALL_ENDED', { reason });
      this.server.in(room).socketsLeave(room);
      await this.postEndedIfFinished(conversationId, ended[0].userId);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async removeFromCall(conversationId: string, userId: string, reason: string) {
    try {
      const removed = await this.callService.removeUserFromRoom(
        conversationId,
        userId,
      );
      if (!removed.length) return;

      const room = callRoom(conversationId);
      const peerIds = removed.map((peer) => peer.peerId);
      this.server
        .to(peerIds)
        .emit('CALL_ENDED', { reason, isRemovedFromConversation: true });
      this.server.in(peerIds).socketsLeave(room);
      for (const peerId of peerIds)
        this.server.to(room).emit('CALL_PEER_LEFT', { peerId });
      await this.postEndedIfFinished(conversationId, userId);
    } catch (error) {
      this.logger.error(error);
    }
  }

  @SubscribeMessage('CALL_LEAVE')
  async handleLeave(@ConnectedSocket() client: TypedSocket) {
    const peer = this.callService.getPeer(client.id);
    await this.leave(client);
    if (peer) await this.endOneToOneCall(peer.conversationId, peer.userId);
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
      await this.postEndedIfFinished(peer.conversationId, peer.userId);
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async endOneToOneCall(conversationId: string, userId: string) {
    try {
      const userIdsInCall = this.callService.userIdsInCall(conversationId);
      if (!userIdsInCall.size || userIdsInCall.has(userId)) return;

      const [isGroupCall, access] = await Promise.all([
        this.callService.isGroupCall(conversationId),
        this.callService.checkAccess(conversationId, userId),
      ]);
      if (isGroupCall) return;

      const name = 'caller' in access ? access.caller.displayName : 'Someone';
      await this.endCall(conversationId, `${name} ended the call`);
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async postEndedIfFinished(conversationId: string, userId: string) {
    const durationSeconds = this.callService.finishIfEmpty(conversationId);
    if (durationSeconds === null) return;

    await this.callNotices.post({
      conversationId,
      userId,
      type: MessageNoticeType.CALL_ENDED,
      value: String(durationSeconds),
    });
  }

  private relayAnswer(
    client: TypedSocket,
    payload: CallPayload,
    memberIds: string[],
    event: 'CALL_ACCEPTED' | 'CALL_DECLINED',
  ) {
    client.to(memberIds).emit(event, {
      conversationId: payload.conversationId,
      userId: client.data.userId,
    });
  }

  private async stopRing(
    conversationId: string,
    callerId: string,
    memberIds: string[],
  ) {
    const outcome = this.callService.stopRing(conversationId, callerId);
    if (outcome !== 'missed') return outcome;

    this.server.to(memberIds).emit('CALL_CANCELLED', { conversationId });
    await this.callNotices.post({
      conversationId,
      userId: callerId,
      type: MessageNoticeType.CALL_MISSED,
    });
    return outcome;
  }

  private async stopRingsCalledFrom(client: TypedSocket) {
    const callerId = client.data.userId;
    if (!callerId) return;

    for (const conversationId of this.callService.ringsCalledFrom(client.id)) {
      const memberIds = await this.memberIdsFor(client, { conversationId });
      if (memberIds) await this.stopRing(conversationId, callerId, memberIds);
    }
  }

  private async memberIdsFor(client: TypedSocket, payload: CallPayload) {
    const userId = client.data.userId;
    if (!userId) return null;

    try {
      const access = await this.callService.checkAccess(
        payload?.conversationId,
        userId,
      );
      if ('error' in access) return null;
      return access.members.map((member) => member.id);
    } catch (error) {
      this.logger.error(error);
      return null;
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
