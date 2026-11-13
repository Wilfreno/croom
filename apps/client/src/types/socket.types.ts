import type { ClientToServerEvents, ServerToClientEvents } from '@repo/types';
import type { Socket } from 'socket.io-client';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Client socket events the server replies to (their last argument is the reply callback). */
export type SocketEventWithServerReply = {
  [E in keyof ClientToServerEvents]: Parameters<ClientToServerEvents[E]> extends [unknown, (result: never) => void]
    ? E
    : never;
}[keyof ClientToServerEvents];

/** What the server replies with for that event when it succeeds. */
export type ServerReplyOfSocketEvent<E extends SocketEventWithServerReply> =
  Parameters<ClientToServerEvents[E]>[1] extends (result: infer Result) => void ? Exclude<Result, { error: string }> : never;
