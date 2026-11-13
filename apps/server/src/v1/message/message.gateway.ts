import fastifyCookie from '@fastify/cookie';
import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SESSION_COOKIE } from '@repo/constants';
import { UserStatus } from '@repo/enums';
import type { ServerToClientEvents } from '@repo/types';
import type {
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
 * (the client must connect with `withCredentials: true`) and joins a room named
 * after its user id, so a message can be pushed to every device of a user.
 */
@WebSocketGateway({ namespace: '/io' })
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MessageGateway.name);

  @WebSocketServer()
  server!: TypedServer;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

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

      // Only the first socket of a user (e.g. first tab/device) flips them online.
      const sockets = await this.server.in(user.id).fetchSockets();
      if (sockets.length === 1) {
        await this.updateUserStatus(user.id, UserStatus.ONLINE);
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
