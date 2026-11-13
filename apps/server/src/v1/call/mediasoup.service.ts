import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mediasoup from 'mediasoup';
import type {
  Producer,
  TransportListenInfo,
  WebRtcTransport,
} from 'mediasoup/types';
import { availableParallelism } from 'node:os';
import {
  MEDIASOUP_DEFAULT_MAX_PEERS_PER_ROUTER,
  MEDIASOUP_DEFAULT_PORT,
  MEDIASOUP_MEDIA_CODECS,
} from '../../common/constants/mediasoup.constant';
import { parsePositiveInteger } from '../../common/utils/number.util';
import type {
  CallRouterEntry,
  CallRouting,
  MediasoupWorkerEntry,
} from '../../types/mediasoup.type';

@Injectable()
export class MediasoupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MediasoupService.name);
  private readonly workers: MediasoupWorkerEntry[] = [];
  private readonly calls = new Map<string, CallRouting>(); // conversation id → its routers and feeds
  private readonly callQueues = new Map<string, Promise<void>>(); // conversation id → pending changes
  private maxPeersPerRouter = MEDIASOUP_DEFAULT_MAX_PEERS_PER_ROUTER;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const announcedAddress = this.configService.get<string>(
      'MEDIASOUP_ANNOUNCED_ADDRESS',
    );
    const firstPort = Number(
      this.configService.get<string>('MEDIASOUP_PORT') ??
        MEDIASOUP_DEFAULT_PORT,
    );
    const workerCount =
      Number(this.configService.get<string>('MEDIASOUP_WORKERS')) ||
      availableParallelism();
    const ip = announcedAddress ? '0.0.0.0' : '127.0.0.1';
    this.maxPeersPerRouter =
      parsePositiveInteger(
        this.configService.get<string>('MEDIASOUP_MAX_PEERS_PER_ROUTER'),
      ) ?? MEDIASOUP_DEFAULT_MAX_PEERS_PER_ROUTER;

    for (let index = 0; index < workerCount; index++) {
      const worker = await mediasoup.createWorker({ logLevel: 'warn' });
      worker.on('died', (error) => {
        this.logger.error(`mediasoup worker died: ${error.message}`);
        process.exit(1);
      });

      const port = firstPort + index;
      const listenInfos: TransportListenInfo[] = (['udp', 'tcp'] as const).map(
        (protocol) => ({ protocol, ip, announcedAddress, port }),
      );
      const webRtcServer = await worker.createWebRtcServer({ listenInfos });
      const workerEntry: MediasoupWorkerEntry = {
        worker,
        webRtcServer,
        consumerCount: 0,
        routerCount: 0,
      };
      this.trackConsumerCount(workerEntry);
      this.workers.push(workerEntry);
    }

    this.logger.log(
      `mediasoup: ${workerCount} worker(s) on ${announcedAddress ?? ip}:${firstPort}-${firstPort + workerCount - 1} (udp+tcp)`,
    );
  }

  onModuleDestroy() {
    this.workers.forEach(({ worker }) => worker.close());
  }

  /**
   * Picks the router a new person in the call connects through, and counts them on it.
   * Fills the call's routers in order up to `maxPeersPerRouter`. When all are full, adds a router
   * on the least loaded worker the call isn't on yet and pipes every existing feed into it; when the
   * call already spans every worker, the least full router takes one more instead.
   */
  assignRouter(conversationId: string): Promise<CallRouterEntry> {
    return this.runInCallQueue(conversationId, async () => {
      const call: CallRouting = this.calls.get(conversationId) ?? {
        routers: [],
        producers: new Map(),
      };
      this.calls.set(conversationId, call);

      let routerEntry = call.routers.find(
        (candidate) => candidate.peerCount < this.maxPeersPerRouter,
      );
      if (!routerEntry) {
        const usedWorkers = new Set(
          call.routers.map((entry) => entry.workerEntry),
        );
        const freeWorkers = this.workers.filter(
          (entry) => !usedWorkers.has(entry),
        );
        routerEntry = freeWorkers.length
          ? await this.addRouter(conversationId, call, freeWorkers)
          : call.routers.reduce((least, candidate) =>
              candidate.peerCount < least.peerCount ? candidate : least,
            );
      }

      routerEntry.peerCount++;
      return routerEntry;
    });
  }

  /** Counts a person off their router; the router closes when nobody is left on it. */
  releaseRouter(conversationId: string, routerEntry: CallRouterEntry) {
    return this.runInCallQueue(conversationId, () => {
      routerEntry.peerCount--;
      if (routerEntry.peerCount > 0) return;

      const call = this.calls.get(conversationId);
      if (call) {
        call.routers = call.routers.filter((entry) => entry !== routerEntry);
        if (!call.routers.length) this.calls.delete(conversationId);
      }
      // Closing it also closes its pipes, so feeds piped in from or out to other routers stop too.
      routerEntry.workerEntry.routerCount--;
      routerEntry.router.close();
    });
  }

  /**
   * Makes a new feed available on every router of the call. Resolves once it's piped everywhere,
   * so people on other routers can consume it as soon as they hear about it. A piped feed keeps
   * the same producer id on every router.
   */
  shareProducer(
    conversationId: string,
    origin: CallRouterEntry,
    producer: Producer,
  ) {
    return this.runInCallQueue(conversationId, async () => {
      const call = this.calls.get(conversationId);
      if (!call || producer.closed) return;

      call.producers.set(producer.id, { producer, origin });
      producer.observer.once('close', () => call.producers.delete(producer.id));

      for (const target of call.routers) {
        if (target === origin) continue;
        await this.pipeProducer(producer, origin, target);
      }
    });
  }

  createWebRtcTransport(
    routerEntry: CallRouterEntry,
  ): Promise<WebRtcTransport> {
    return routerEntry.router.createWebRtcTransport({
      webRtcServer: routerEntry.workerEntry.webRtcServer,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });
  }

  /** Creates another router for the call and pipes every feed already in the call into it. */
  private async addRouter(
    conversationId: string,
    call: CallRouting,
    candidateWorkers: MediasoupWorkerEntry[],
  ): Promise<CallRouterEntry> {
    const workerEntry = this.getLeastLoadedWorker(candidateWorkers);
    const router = await workerEntry.worker.createRouter({
      mediaCodecs: MEDIASOUP_MEDIA_CODECS,
    });
    workerEntry.routerCount++;
    const routerEntry: CallRouterEntry = { router, workerEntry, peerCount: 0 };

    for (const { producer, origin } of call.producers.values()) {
      await this.pipeProducer(producer, origin, routerEntry);
    }
    call.routers.push(routerEntry);

    if (call.routers.length > 1)
      this.logger.log(
        `call ${conversationId} now spans ${call.routers.length} routers`,
      );
    return routerEntry;
  }

  private async pipeProducer(
    producer: Producer,
    origin: CallRouterEntry,
    target: CallRouterEntry,
  ) {
    try {
      await origin.router.pipeToRouter({
        producerId: producer.id,
        router: target.router,
      });
    } catch (error) {
      // People on the target router won't get this feed; everyone else still does.
      this.logger.error(`could not pipe producer ${producer.id}`, error);
    }
  }

  /**
   * Runs changes to one call's routers one after another, so two people joining at once can't
   * both create a router, and a feed can't be piped while a router is being added or removed.
   */
  private runInCallQueue<T>(
    conversationId: string,
    task: () => T | Promise<T>,
  ): Promise<T> {
    const previous = this.callQueues.get(conversationId) ?? Promise.resolve();
    const result = previous.then(task);
    const settled = result.then(
      () => undefined,
      () => undefined,
    );
    this.callQueues.set(conversationId, settled);
    void settled.then(() => {
      if (this.callQueues.get(conversationId) === settled)
        this.callQueues.delete(conversationId);
    });
    return result;
  }

  /** Fewest streams being forwarded wins; then fewest routers; then the lowest index. */
  private getLeastLoadedWorker(candidates: MediasoupWorkerEntry[]) {
    return candidates.reduce((least, candidate) => {
      if (candidate.consumerCount !== least.consumerCount)
        return candidate.consumerCount < least.consumerCount
          ? candidate
          : least;
      return candidate.routerCount < least.routerCount ? candidate : least;
    });
  }

  private trackConsumerCount(workerEntry: MediasoupWorkerEntry) {
    workerEntry.worker.observer.on('newrouter', (router) =>
      router.observer.on('newtransport', (transport) =>
        transport.observer.on('newconsumer', (consumer) => {
          workerEntry.consumerCount++;
          consumer.observer.once('close', () => workerEntry.consumerCount--);
        }),
      ),
    );
  }
}
