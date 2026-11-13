import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@repo/types';
import type { Server, Socket } from 'socket.io';

export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
