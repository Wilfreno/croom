import type { Producer, Router, WebRtcServer, Worker } from 'mediasoup/types';

/** One mediasoup worker (one CPU core) with the WebRtcServer all of its transports share. */
export type MediasoupWorkerEntry = {
  worker: Worker;
  webRtcServer: WebRtcServer;
  /** Streams this worker is forwarding right now (its consumers); new routers go to the lowest. */
  consumerCount: number;
  /** Routers hosted on this worker; breaks ties between equally loaded workers. */
  routerCount: number;
};

/** One router of a call: the slice of the call that lives on one worker. */
export type CallRouterEntry = {
  router: Router;
  workerEntry: MediasoupWorkerEntry;
  /** People connected through this router. */
  peerCount: number;
};

/** Every router a call is spread across, and every feed in the call with the router it came in on. */
export type CallRouting = {
  routers: CallRouterEntry[];
  producers: Map<string, { producer: Producer; origin: CallRouterEntry }>;
};
