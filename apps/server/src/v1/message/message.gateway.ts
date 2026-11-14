import fastifyCookie from '@fastify/cookie';
import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SESSION_COOKIE } from '@repo/constants';
import { UserStatus } from '@repo/enums';
import type { ServerToClientEvents } from '@repo/types';
import type {
  TypedNamespace,
  TypedServer,
  TypedSocket,
} from '../../common/types/socket-io.types';
import { serializeIds } from '../../common/utils/serialize-ids.util';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';

/**
 * Real-time delivery for messages on the `/io` namespace.
 *
 * Each socket is authenticated from the session cookie sent with the handshake
 * (the client must connect with `withCredentials: true`) before it connects, and joins a room named
 * after its user id, so a message can be pushed to every device of a user.
 */
@WebSocketGateway({ namespace: '/io' })
export class MessageGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MessageGateway.name);

  @WebSocketServer()
  server!: TypedServer;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  /**
   * Authenticates every socket in a namespace middleware rather than in
   * `handleConnection`: middleware finishes before the client sees `connect`,
   * so no event (e.g. `CALL_JOIN`) can arrive before `client.data.userId` is
   * set. `handleConnection` is not awaited by socket.io, so on a slow database
   * it used to lose that race.
   */
  afterInit(namespace: TypedNamespace) {
    namespace.use((client, next) => {
      this.authenticate(client).then(
        (userId) => {
          if (!userId) return next(new Error('you are not logged in'));
          client.data.userId = userId;
          next();
        },
        (error: unknown) => {
          this.logger.error(error);
          next(new Error('could not connect'));
        },
      );
    });
  }

  /** Resolves the session cookie sent with the handshake to a user id. */
  async authenticate(client: TypedSocket): Promise<string | null> {
    const cookieHeader = client.handshake.headers.cookie;
    const token = cookieHeader
      ? fastifyCookie.parse(cookieHeader)[SESSION_COOKIE]
      : undefined;
    if (!token) return null;

    const user = await this.authService.resolveSession(token);
    return user?.id ?? null;
  }

  async handleConnection(client: TypedSocket) {
    const userId = client.data.userId;
    if (!userId) {
      client.disconnect();
      return;
    }

    try {
      await client.join(userId);

      // Only the first socket of a user (e.g. first tab/device) flips them online.
      const sockets = await this.server.in(userId).fetchSockets();
      if (sockets.length === 1) {
        await this.updateUserStatus(userId, UserStatus.ONLINE);
      }
    } catch (error) {
      this.logger.error(error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: TypedSocket) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      // The disconnecting socket has already left its rooms at this point.
      const sockets = await this.server.in(userId).fetchSockets();
      if (sockets.length === 0) {
        await this.updateUserStatus(userId, UserStatus.OFFLINE);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  /** Persists the user's presence and notifies everyone who shares a conversation with them. */
  private async updateUserStatus(userId: string, status: UserStatus) {
    const result = await this.userService.updateUserStatus(userId, status);
    if (!result) return;

    const { partnerIds, ...presence } = result;
    this.emitToUsers(partnerIds, 'USER_STATUS', { userId, ...presence });
  }

  /** Pushes an event to every connected socket of the given users. */
  emitToUsers<Event extends keyof ServerToClientEvents>(
    userIds: string[],
    event: Event,
    ...payload: Parameters<ServerToClientEvents[Event]>
  ) {
    if (!userIds.length) return;
    this.server
      .to(userIds)
      .emit(
        event,
        ...(serializeIds(payload) as Parameters<ServerToClientEvents[Event]>),
      );
  }
}
