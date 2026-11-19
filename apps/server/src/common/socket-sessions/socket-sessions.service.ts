import { Injectable, Logger } from '@nestjs/common';
import { hashSessionToken } from '@repo/models';
import type { TypedNamespace } from '../types/socket-io.types';

@Injectable()
export class SocketSessionsService {
  private readonly logger = new Logger(SocketSessionsService.name);
  private namespace: TypedNamespace | null = null;

  attach(namespace: TypedNamespace) {
    this.namespace = namespace;
  }

  async disconnectUser(
    userId: string,
    { exceptSessionToken }: { exceptSessionToken?: string } = {},
  ) {
    if (!this.namespace) return;

    const keptTokenHash = exceptSessionToken
      ? hashSessionToken(exceptSessionToken)
      : null;

    try {
      const sockets = await this.namespace.in(userId).fetchSockets();

      for (const socket of sockets) {
        const isKeptSession =
          keptTokenHash !== null &&
          socket.data.sessionTokenHash === keptTokenHash;
        if (isKeptSession) continue;

        socket.disconnect(true);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
