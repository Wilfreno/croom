import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MEDIASOUP_DEFAULT_MAX_PEERS_PER_ROUTER,
  MEDIASOUP_DEFAULT_PORT,
  MEDIASOUP_MEDIA_CODECS,
} from '../../common/constants/mediasoup.constant';
import type { CallRouterEntry } from '../../types/mediasoup.type';
import { MediasoupService } from './mediasoup.service';

/* ---------- a fake mediasoup: workers → routers → transports → consumers ---------- */

let routerCounter = 0;

class FakeRouter {
  id = `router-${++routerCounter}`;
  observer = new EventEmitter();
  close = vi.fn();
  pipeToRouter = vi.fn(async (_: { producerId: string; router: FakeRouter }) => ({}));
  createWebRtcTransport = vi.fn(async (options: object) => ({ id: 'transport', options }));
}

class FakeWorker extends EventEmitter {
  observer = new EventEmitter();
  routers: FakeRouter[] = [];
  close = vi.fn();
  createWebRtcServer = vi.fn(async (options: object) => ({ id: `server-of-${this.name}`, options }));
  createRouter = vi.fn(async (_: object) => {
    const router = new FakeRouter();
    this.routers.push(router);
    this.observer.emit('newrouter', router);
    return router;
  });
  constructor(public name: string) {
    super();
  }
}

const workers = vi.hoisted(() => [] as unknown[]);

vi.mock('mediasoup', () => ({
  createWorker: vi.fn(async () => {
    const worker = new FakeWorker(`worker-${workers.length}`);
    workers.push(worker);
    return worker;
  }),
}));

function fakeWorkers() {
  return workers as FakeWorker[];
}

function producer(id: string) {
  return { id, closed: false, observer: new EventEmitter() } as never as {
    id: string;
    closed: boolean;
    observer: EventEmitter;
  };
}

async function build(config: Record<string, string | undefined> = {}) {
  const configService = { get: vi.fn((key: string) => config[key]) } as unknown as ConfigService;
  const service = new MediasoupService(configService);
  await service.onModuleInit();
  return service;
}

/** Simulates one stream being forwarded on a worker, by walking mediasoup's observer events. */
function addConsumerOn(worker: FakeWorker) {
  const router = new FakeRouter();
  worker.observer.emit('newrouter', router);
  const transport = { observer: new EventEmitter() };
  router.observer.emit('newtransport', transport);
  const consumer = { observer: new EventEmitter() };
  transport.observer.emit('newconsumer', consumer);
  return consumer;
}

beforeEach(() => {
  workers.length = 0;
  routerCounter = 0;
});
afterEach(() => vi.restoreAllMocks());

describe('MediasoupService', () => {
  describe('starting up', () => {
    it('starts the configured number of workers on consecutive ports, local only by default', async () => {
      await build({ MEDIASOUP_WORKERS: '3' });

      expect(fakeWorkers()).toHaveLength(3);
      fakeWorkers().forEach((worker, index) => {
        expect(worker.createWebRtcServer).toHaveBeenCalledWith({
          listenInfos: [
            { protocol: 'udp', ip: '127.0.0.1', announcedAddress: undefined, port: MEDIASOUP_DEFAULT_PORT + index },
            { protocol: 'tcp', ip: '127.0.0.1', announcedAddress: undefined, port: MEDIASOUP_DEFAULT_PORT + index },
          ],
        });
      });
    });

    it('listens on every interface and announces the public address when one is set', async () => {
      await build({ MEDIASOUP_WORKERS: '1', MEDIASOUP_ANNOUNCED_ADDRESS: '203.0.113.5', MEDIASOUP_PORT: '50000' });

      expect(fakeWorkers()[0].createWebRtcServer).toHaveBeenCalledWith({
        listenInfos: [
          { protocol: 'udp', ip: '0.0.0.0', announcedAddress: '203.0.113.5', port: 50000 },
          { protocol: 'tcp', ip: '0.0.0.0', announcedAddress: '203.0.113.5', port: 50000 },
        ],
      });
    });

    it('exits when a worker dies, since its calls cannot recover', async () => {
      const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      await build({ MEDIASOUP_WORKERS: '1' });

      fakeWorkers()[0].emit('died', new Error('segfault'));

      expect(exit).toHaveBeenCalledWith(1);
    });

    it('closes every worker on shutdown', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '2' });

      service.onModuleDestroy();

      fakeWorkers().forEach((worker) => expect(worker.close).toHaveBeenCalled());
    });
  });

  describe('assignRouter', () => {
    it('creates a router with the call codecs for the first person', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '2' });

      const entry = await service.assignRouter('c1');

      expect(entry.peerCount).toBe(1);
      expect(fakeWorkers()[0].createRouter).toHaveBeenCalledWith({ mediaCodecs: MEDIASOUP_MEDIA_CODECS });
      expect(entry.workerEntry.routerCount).toBe(1);
    });

    it('fills one router up to the limit before using another', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '2', MEDIASOUP_MAX_PEERS_PER_ROUTER: '2' });

      const first = await service.assignRouter('c1');
      const second = await service.assignRouter('c1');
      const third = await service.assignRouter('c1');

      expect(second).toBe(first);
      expect(third).not.toBe(first);
      expect(third.workerEntry).not.toBe(first.workerEntry);
    });

    it('uses the default limit when none is configured', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '2', MEDIASOUP_MAX_PEERS_PER_ROUTER: 'nonsense' });

      const entries: CallRouterEntry[] = [];
      for (let i = 0; i <= MEDIASOUP_DEFAULT_MAX_PEERS_PER_ROUTER; i++) entries.push(await service.assignRouter('c1'));

      expect(new Set(entries.slice(0, -1)).size).toBe(1);
      expect(entries.at(-1)).not.toBe(entries[0]);
    });

    it('lets the least full router go over the limit once the call spans every worker', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '2', MEDIASOUP_MAX_PEERS_PER_ROUTER: '1' });
      const first = await service.assignRouter('c1');
      const second = await service.assignRouter('c1');
      second.peerCount = 3; // both routers are full, and the second one more so

      const third = await service.assignRouter('c1');

      expect(third).toBe(first);
      expect(fakeWorkers().flatMap((w) => w.routers)).toHaveLength(2);
    });

    it('keeps separate calls on separate routers', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '1' });

      const a = await service.assignRouter('c1');
      const b = await service.assignRouter('c2');

      expect(a).not.toBe(b);
    });

    it('creates only one router when two people join at the same moment', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '2' });

      const [a, b] = await Promise.all([service.assignRouter('c1'), service.assignRouter('c1')]);

      expect(a).toBe(b);
      expect(a.peerCount).toBe(2);
      expect(fakeWorkers().flatMap((w) => w.routers)).toHaveLength(1);
    });

    it('puts a new router on the worker forwarding the fewest streams', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '2' });
      addConsumerOn(fakeWorkers()[0]);

      const entry = await service.assignRouter('c1');

      expect(entry.workerEntry.worker).toBe(fakeWorkers()[1]);
    });

    it('stops counting a stream once its consumer closes', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '2' });
      const consumer = addConsumerOn(fakeWorkers()[0]);
      consumer.observer.emit('close');

      const entry = await service.assignRouter('c1');

      expect(entry.workerEntry.worker).toBe(fakeWorkers()[0]);
    });

    it('pipes every feed already in the call into a new router', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '2', MEDIASOUP_MAX_PEERS_PER_ROUTER: '1' });
      const origin = await service.assignRouter('c1');
      await service.shareProducer('c1', origin, producer('p1') as never);

      const target = await service.assignRouter('c1');

      expect(origin.router.pipeToRouter).toHaveBeenCalledWith({ producerId: 'p1', router: target.router });
    });
  });

  describe('releaseRouter', () => {
    it('keeps a router open while people are still on it', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '1' });
      const entry = await service.assignRouter('c1');
      await service.assignRouter('c1');

      await service.releaseRouter('c1', entry);

      expect(entry.peerCount).toBe(1);
      expect(entry.router.close).not.toHaveBeenCalled();
    });

    it('closes a router once its last person leaves, and forgets the call', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '1' });
      const entry = await service.assignRouter('c1');

      await service.releaseRouter('c1', entry);

      expect(entry.router.close).toHaveBeenCalled();
      expect(entry.workerEntry.routerCount).toBe(0);
      const next = await service.assignRouter('c1');
      expect(next).not.toBe(entry);
    });
  });

  describe('shareProducer', () => {
    it('pipes a new feed to every other router of the call', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '3', MEDIASOUP_MAX_PEERS_PER_ROUTER: '1' });
      const a = await service.assignRouter('c1');
      const b = await service.assignRouter('c1');
      const c = await service.assignRouter('c1');

      await service.shareProducer('c1', b, producer('p1') as never);

      expect(b.router.pipeToRouter).toHaveBeenCalledWith({ producerId: 'p1', router: a.router });
      expect(b.router.pipeToRouter).toHaveBeenCalledWith({ producerId: 'p1', router: c.router });
      expect(b.router.pipeToRouter).toHaveBeenCalledTimes(2);
    });

    it('ignores a feed that already closed', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '2', MEDIASOUP_MAX_PEERS_PER_ROUTER: '1' });
      const origin = await service.assignRouter('c1');
      await service.assignRouter('c1');
      const closed = producer('p1');
      closed.closed = true;

      await service.shareProducer('c1', origin, closed as never);

      expect(origin.router.pipeToRouter).not.toHaveBeenCalled();
    });

    it('ignores a feed for a call that has ended', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '1' });
      const origin = await service.assignRouter('c1');
      await service.releaseRouter('c1', origin);

      await expect(service.shareProducer('c1', origin, producer('p1') as never)).resolves.toBeUndefined();
    });

    it('does not pipe a feed into later routers once it has closed', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '2', MEDIASOUP_MAX_PEERS_PER_ROUTER: '1' });
      const origin = await service.assignRouter('c1');
      const feed = producer('p1');
      await service.shareProducer('c1', origin, feed as never);

      feed.observer.emit('close');
      await service.assignRouter('c1');

      expect(origin.router.pipeToRouter).not.toHaveBeenCalled();
    });

    it('keeps going when one pipe fails', async () => {
      const service = await build({ MEDIASOUP_WORKERS: '3', MEDIASOUP_MAX_PEERS_PER_ROUTER: '1' });
      const origin = await service.assignRouter('c1');
      await service.assignRouter('c1');
      await service.assignRouter('c1');
      vi.mocked(origin.router.pipeToRouter).mockRejectedValueOnce(new Error('pipe failed'));

      await expect(service.shareProducer('c1', origin, producer('p1') as never)).resolves.toBeUndefined();

      expect(origin.router.pipeToRouter).toHaveBeenCalledTimes(2);
    });
  });

  describe('createWebRtcTransport', () => {
    it("creates the transport on the worker's shared WebRtcServer", async () => {
      const service = await build({ MEDIASOUP_WORKERS: '1' });
      const entry = await service.assignRouter('c1');

      await service.createWebRtcTransport(entry);

      expect(entry.router.createWebRtcTransport).toHaveBeenCalledWith({
        webRtcServer: entry.workerEntry.webRtcServer,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      });
    });
  });
});
