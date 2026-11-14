import fastifyCookie from '@fastify/cookie';
import { SESSION_COOKIE } from '@repo/constants';
import Fastify from 'fastify';
import { UserStatus } from '@repo/enums';
import { Types } from 'mongoose';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TypedNamespace, TypedServer, TypedSocket } from '../../common/types/socket-io.types';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { MessageGateway } from './message.gateway';

const USER_ID = '64b7f0c2a1b2c3d4e5f60718';

function fakeClient(cookie?: string) {
  const client = {
    handshake: { headers: cookie === undefined ? {} : { cookie } },
    data: {} as { userId?: string },
    emit: vi.fn(),
    disconnect: vi.fn(),
    join: vi.fn(async () => undefined),
  };
  return { client: client as unknown as TypedSocket, spies: client };
}

function build({ socketsInRoom = 1 } = {}) {
  const authService = { resolveSession: vi.fn().mockResolvedValue({ id: USER_ID }) };
  const userService = {
    updateUserStatus: vi.fn().mockResolvedValue({
      status: UserStatus.ONLINE,
      lastOnline: '2026-11-13T00:00:00.000Z',
      partnerIds: ['partner-1', 'partner-2'],
    }),
  };
  const gateway = new MessageGateway(authService as unknown as AuthService, userService as unknown as UserService);
  const fetchSockets = vi.fn(async () => Array.from({ length: socketsInRoom }));
  const roomEmit = vi.fn();
  const server = { in: vi.fn(() => ({ fetchSockets })), to: vi.fn(() => ({ emit: roomEmit })) };
  gateway.server = server as unknown as TypedServer;
  return { gateway, authService, userService, server, fetchSockets, roomEmit };
}

// `fastifyCookie.parse` only works once the plugin has loaded its parser, which main.ts does at boot.
beforeAll(async () => {
  const app = Fastify();
  await app.register(fastifyCookie);
  await app.ready();
  await app.close();
});

beforeEach(() => vi.clearAllMocks());

describe('MessageGateway', () => {
  describe('afterInit (handshake middleware)', () => {
    function runMiddleware(gateway: MessageGateway, client: TypedSocket) {
      let middleware!: (socket: TypedSocket, next: (error?: Error) => void) => void;
      const namespace = { use: vi.fn((fn: typeof middleware) => (middleware = fn)) };
      gateway.afterInit(namespace as unknown as TypedNamespace);
      return new Promise<Error | undefined>((resolve) => middleware(client, resolve));
    }

    it('authenticates from the session cookie before the socket connects', async () => {
      const { gateway, authService } = build();
      const { client, spies } = fakeClient(`other=1; ${SESSION_COOKIE}=token-123`);

      await expect(runMiddleware(gateway, client)).resolves.toBeUndefined();

      expect(authService.resolveSession).toHaveBeenCalledWith('token-123');
      expect(spies.data.userId).toBe(USER_ID);
    });

    it.each([
      ['no cookie header', undefined],
      ['no session cookie', 'theme=dark'],
    ])('rejects a handshake with %s', async (_, cookie) => {
      const { gateway, authService } = build();
      const { client, spies } = fakeClient(cookie);

      const error = await runMiddleware(gateway, client);

      expect(authService.resolveSession).not.toHaveBeenCalled();
      expect(error?.message).toBe('you are not logged in');
      expect(spies.data.userId).toBeUndefined();
    });

    it('rejects a handshake whose session is invalid', async () => {
      const { gateway, authService } = build();
      authService.resolveSession.mockResolvedValue(null);
      const { client } = fakeClient(`${SESSION_COOKIE}=expired`);

      expect((await runMiddleware(gateway, client))?.message).toBe('you are not logged in');
    });

    it('rejects instead of throwing when the lookup fails', async () => {
      const { gateway, authService } = build();
      authService.resolveSession.mockRejectedValue(new Error('db down'));
      const { client } = fakeClient(`${SESSION_COOKIE}=t`);

      expect((await runMiddleware(gateway, client))?.message).toBe('could not connect');
    });
  });

  describe('handleConnection', () => {
    function authenticated() {
      const { client, spies } = fakeClient();
      spies.data.userId = USER_ID;
      return { client, spies };
    }

    it("joins the user's room", async () => {
      const { gateway } = build();
      const { client, spies } = authenticated();

      await gateway.handleConnection(client);

      expect(spies.join).toHaveBeenCalledWith(USER_ID);
      expect(spies.disconnect).not.toHaveBeenCalled();
    });

    it('marks the user online on their first socket and tells their partners', async () => {
      const { gateway, userService, server, roomEmit } = build({ socketsInRoom: 1 });

      await gateway.handleConnection(authenticated().client);

      expect(userService.updateUserStatus).toHaveBeenCalledWith(USER_ID, UserStatus.ONLINE);
      expect(server.to).toHaveBeenCalledWith(['partner-1', 'partner-2']);
      expect(roomEmit).toHaveBeenCalledWith('USER_STATUS', {
        userId: USER_ID,
        status: UserStatus.ONLINE,
        lastOnline: '2026-11-13T00:00:00.000Z',
      });
    });

    it('does not re-announce a user who already has another socket open', async () => {
      const { gateway, userService } = build({ socketsInRoom: 2 });

      await gateway.handleConnection(authenticated().client);

      expect(userService.updateUserStatus).not.toHaveBeenCalled();
    });

    it('disconnects a socket that was never authenticated', async () => {
      const { gateway } = build();
      const { client, spies } = fakeClient();

      await gateway.handleConnection(client);

      expect(spies.disconnect).toHaveBeenCalled();
      expect(spies.join).not.toHaveBeenCalled();
    });

    it('disconnects instead of throwing when something fails', async () => {
      const { gateway, fetchSockets } = build();
      fetchSockets.mockRejectedValue(new Error('adapter down'));
      const { client, spies } = authenticated();

      await expect(gateway.handleConnection(client)).resolves.toBeUndefined();
      expect(spies.disconnect).toHaveBeenCalled();
    });

    it('announces nothing when the status could not be saved', async () => {
      const { gateway, userService, server } = build();
      userService.updateUserStatus.mockResolvedValue(null);

      await gateway.handleConnection(authenticated().client);

      expect(server.to).not.toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    function connected() {
      const { client, spies } = fakeClient();
      spies.data.userId = USER_ID;
      return client;
    }

    it("marks the user offline once their last socket is gone", async () => {
      const { gateway, userService } = build({ socketsInRoom: 0 });

      await gateway.handleDisconnect(connected());

      expect(userService.updateUserStatus).toHaveBeenCalledWith(USER_ID, UserStatus.OFFLINE);
    });

    it('keeps them online while another socket remains', async () => {
      const { gateway, userService } = build({ socketsInRoom: 1 });

      await gateway.handleDisconnect(connected());

      expect(userService.updateUserStatus).not.toHaveBeenCalled();
    });

    it('ignores a socket that never authenticated', async () => {
      const { gateway, fetchSockets } = build({ socketsInRoom: 0 });

      await gateway.handleDisconnect(fakeClient().client);

      expect(fetchSockets).not.toHaveBeenCalled();
    });

    it('swallows a failure', async () => {
      const { gateway, userService } = build({ socketsInRoom: 0 });
      userService.updateUserStatus.mockRejectedValue(new Error('db down'));

      await expect(gateway.handleDisconnect(connected())).resolves.toBeUndefined();
    });
  });

  describe('emitToUsers', () => {
    it('sends nothing to an empty list', () => {
      const { gateway, server } = build();

      gateway.emitToUsers([], 'ERROR', 'x');

      expect(server.to).not.toHaveBeenCalled();
    });

    it('serializes Mongo ids in the payload', () => {
      const { gateway, server, roomEmit } = build();
      const _id = new Types.ObjectId();

      gateway.emitToUsers(['u1'], 'MESSAGE', { _id, text: 'hi' } as never);

      expect(server.to).toHaveBeenCalledWith(['u1']);
      expect(roomEmit).toHaveBeenCalledWith('MESSAGE', { id: _id.toString(), text: 'hi' });
    });
  });
});
