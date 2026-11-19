import { hashSessionToken } from '@repo/models';
import { describe, expect, it, vi } from 'vitest';
import type { TypedNamespace } from '../types/socket-io.types';
import { SocketSessionsService } from './socket-sessions.service';

const USER_ID = '64b7f0c2a1b2c3d4e5f60718';

function socketFor(token: string) {
  return {
    data: { userId: USER_ID, sessionTokenHash: hashSessionToken(token) },
    disconnect: vi.fn(),
  };
}

function build(sockets: ReturnType<typeof socketFor>[]) {
  const fetchSockets = vi.fn().mockResolvedValue(sockets);
  const namespace = { in: vi.fn(() => ({ fetchSockets })) };
  const service = new SocketSessionsService();
  service.attach(namespace as unknown as TypedNamespace);
  return { service, namespace, fetchSockets };
}

describe('SocketSessionsService', () => {
  it('does nothing before a namespace is attached', async () => {
    const service = new SocketSessionsService();

    await expect(service.disconnectUser(USER_ID)).resolves.toBeUndefined();
  });

  it('disconnects every socket of the user', async () => {
    const [first, second] = [socketFor('a'), socketFor('b')];
    const { service, namespace } = build([first, second]);

    await service.disconnectUser(USER_ID);

    expect(namespace.in).toHaveBeenCalledWith(USER_ID);
    expect(first.disconnect).toHaveBeenCalledWith(true);
    expect(second.disconnect).toHaveBeenCalledWith(true);
  });

  it('keeps the sockets of the session it is told to spare', async () => {
    const [kept, other] = [socketFor('kept'), socketFor('other')];
    const { service } = build([kept, other]);

    await service.disconnectUser(USER_ID, { exceptSessionToken: 'kept' });

    expect(kept.disconnect).not.toHaveBeenCalled();
    expect(other.disconnect).toHaveBeenCalledWith(true);
  });

  it('does not throw when the sockets cannot be fetched', async () => {
    const { service, fetchSockets } = build([]);
    fetchSockets.mockRejectedValue(new Error('adapter down'));

    await expect(service.disconnectUser(USER_ID)).resolves.toBeUndefined();
  });
});
