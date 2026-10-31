import fastifyCookie from '@fastify/cookie';
import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SESSION_COOKIE } from '@repo/constants';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@repo/types';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

/**
 * Real-time delivery for messages on the `/io` namespace.
 *
 * Each socket is authenticated from the session cookie sent with the handshake
 * (the client must connect with `withCredentials: true`) and joins a room named
 * after its user id, so a message can be pushed to every device of a user.
 */
@WebSocketGateway({ namespace: '/io' })
export class MessageGateway implements OnGatewayConnection {
  private readonly logger = new Logger(MessageGateway.name);

  @WebSocketServer()
  server!: TypedServer;

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: TypedSocket) {
    try {
      const cookieHeader = client.handshake.headers.cookie;
      const token = cookieHeader
        ? fastifyCookie.parse(cookieHeader)[SESSION_COOKIE]
        : undefined;
      const user = token ? await this.authService.resolveSession(token) : null;

      if (!user) {
        client.emit('ERROR', 'you are not logged in');
        client.disconnect();
        return;
      }

      client.data.userId = user.id;
      await client.join(user.id);
    } catch (error) {
      this.logger.error(error);
      client.disconnect();
    }
  }

  /** Pushes an event to every connected socket of the given users. */
  emitToUsers<Event extends keyof ServerToClientEvents>(
    userIds: string[],
    event: Event,
    ...payload: Parameters<ServerToClientEvents[Event]>
  ) {
    if (!userIds.length) return;
    this.server.to(userIds).emit(event, ...payload);
  }
}
