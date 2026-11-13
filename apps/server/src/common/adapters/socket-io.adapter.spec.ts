import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SocketIoAdapter } from './socket-io.adapter';

describe('SocketIoAdapter', () => {
  afterEach(() => vi.restoreAllMocks());

  it('allows the client origin with credentials, keeping the other options', () => {
    const create = vi.spyOn(IoAdapter.prototype, 'createIOServer').mockReturnValue({} as never);
    const adapter = new SocketIoAdapter({} as INestApplicationContext, 'https://croom.app');

    adapter.createIOServer(3000, { path: '/socket', cors: { origin: '*' } } as never);

    expect(create).toHaveBeenCalledWith(3000, {
      path: '/socket',
      cors: { origin: 'https://croom.app', credentials: true },
    });
  });

  it('works without extra options', () => {
    const create = vi.spyOn(IoAdapter.prototype, 'createIOServer').mockReturnValue({} as never);
    const adapter = new SocketIoAdapter({} as INestApplicationContext, 'http://localhost:3000');

    adapter.createIOServer(0);

    expect(create).toHaveBeenCalledWith(0, { cors: { origin: 'http://localhost:3000', credentials: true } });
  });
});
