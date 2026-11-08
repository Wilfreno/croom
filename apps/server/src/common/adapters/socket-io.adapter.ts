import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

/**
 * Socket.IO adapter that applies the same CORS origin as the HTTP routes.
 *
 * `app.enableCors()` only covers HTTP, and `@WebSocketGateway({ cors })` is
 * evaluated at import time, before `ConfigModule` has loaded `.env`, so the
 * origin is injected here at bootstrap instead.
 */
export class SocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly clientUrl: string | undefined,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.clientUrl, credentials: true },
    });
  }
}
