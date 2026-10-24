import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { SESSION_COOKIE, SESSION_LIFETIME_SECONDS } from '@repo/constants';
import type { AuthenticatedUser } from '@repo/types';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const USER = { id: 'abc', email: 'ada@example.com' } as AuthenticatedUser;
const CREDENTIALS = { email: 'ada@example.com', password: 'sup3rsecret' };
const CLIENT_URL = 'https://croom.app';

function build() {
  const authService = {
    issueSession: vi.fn().mockResolvedValue('a-token'),
    logout: vi.fn().mockResolvedValue(undefined),
  };
  const reply = {
    setCookie: vi.fn(),
    clearCookie: vi.fn(),
    redirect: vi.fn(),
  };

  return { authService, reply };
}

type Mocks = ReturnType<typeof build>;

async function makeController(mocks: Mocks, env: Record<string, string> = {}) {
  const config = { CLIENT_URL, ...env };

  const moduleRef = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      { provide: AuthService, useValue: mocks.authService },
      {
        provide: ConfigService,
        useValue: { get: (key: string) => config[key] },
      },
    ],
  }).compile();

  return moduleRef.get(AuthController);
}

const request = (overrides: Record<string, unknown> = {}) =>
  ({
    ip: '203.0.113.4',
    headers: {},
    cookies: {},
    ...overrides,
  }) as unknown as FastifyRequest;

const cookieOptions = (mocks: Mocks) => mocks.reply.setCookie.mock.calls[0][2];

describe('AuthController', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('login', () => {
    it('answers with the user', async () => {
      const mocks = build();
      const controller = await makeController(mocks);

      const user = await controller.login(
        CREDENTIALS,
        USER,
        request(),
        mocks.reply as unknown as FastifyReply,
      );

      expect(user).toBe(USER);
    });

    it('puts the token in the session cookie', async () => {
      const mocks = build();
      const controller = await makeController(mocks);

      await controller.login(
        CREDENTIALS,
        USER,
        request(),
        mocks.reply as unknown as FastifyReply,
      );

      expect(mocks.reply.setCookie).toHaveBeenCalledWith(
        SESSION_COOKIE,
        'a-token',
        expect.anything(),
      );
    });

    it('keeps the token out of the body, where a script could read it', async () => {
      const mocks = build();
      const controller = await makeController(mocks);

      const user = await controller.login(
        CREDENTIALS,
        USER,
        request(),
        mocks.reply as unknown as FastifyReply,
      );

      expect(JSON.stringify(user)).not.toContain('a-token');
    });

    it('passes the caller ip and user agent through to the session', async () => {
      const mocks = build();
      const controller = await makeController(mocks);

      await controller.login(
        CREDENTIALS,
        USER,
        request({ headers: { 'user-agent': 'Firefox' } }),
        mocks.reply as unknown as FastifyReply,
      );

      expect(mocks.authService.issueSession).toHaveBeenCalledWith(USER, {
        ip: '203.0.113.4',
        userAgent: 'Firefox',
      });
    });

    it('makes the cookie unreadable to scripts and scoped to the whole api', async () => {
      const mocks = build();
      const controller = await makeController(mocks);

      await controller.login(
        CREDENTIALS,
        USER,
        request(),
        mocks.reply as unknown as FastifyReply,
      );

      expect(cookieOptions(mocks)).toMatchObject({
        httpOnly: true,
        path: '/',
        maxAge: SESSION_LIFETIME_SECONDS,
      });
    });

    it('leaves the cookie usable over plain http in development', async () => {
      const mocks = build();
      const controller = await makeController(mocks);

      await controller.login(
        CREDENTIALS,
        USER,
        request(),
        mocks.reply as unknown as FastifyReply,
      );

      expect(cookieOptions(mocks)).toMatchObject({
        secure: false,
        sameSite: 'lax',
      });
    });

    it('requires https in production, where the client is on another domain', async () => {
      const mocks = build();
      const controller = await makeController(mocks, {
        NODE_ENV: 'production',
      });

      await controller.login(
        CREDENTIALS,
        USER,
        request(),
        mocks.reply as unknown as FastifyReply,
      );

      expect(cookieOptions(mocks)).toMatchObject({
        secure: true,
        sameSite: 'none',
      });
    });
  });

  describe('session', () => {
    it('answers with whoever the guard resolved', async () => {
      const controller = await makeController(build());

      expect(controller.session(USER)).toBe(USER);
    });
  });

  describe('logout', () => {
    it('revokes the session behind the cookie', async () => {
      const mocks = build();
      const controller = await makeController(mocks);

      await controller.logout(
        request({ cookies: { [SESSION_COOKIE]: 'a-token' } }),
        mocks.reply as unknown as FastifyReply,
      );

      expect(mocks.authService.logout).toHaveBeenCalledWith('a-token');
    });

    // Revoking without clearing leaves the browser sending a dead token
    // forever; clearing without revoking leaves a copy of it working elsewhere.
    it('clears the cookie as well as the row', async () => {
      const mocks = build();
      const controller = await makeController(mocks);

      await controller.logout(
        request({ cookies: { [SESSION_COOKIE]: 'a-token' } }),
        mocks.reply as unknown as FastifyReply,
      );

      expect(mocks.reply.clearCookie).toHaveBeenCalledWith(
        SESSION_COOKIE,
        expect.anything(),
      );
    });

    it('sends the browser back to the login page', async () => {
      const mocks = build();
      const controller = await makeController(mocks);

      await controller.logout(
        request({ cookies: { [SESSION_COOKIE]: 'a-token' } }),
        mocks.reply as unknown as FastifyReply,
      );

      expect(mocks.reply.redirect).toHaveBeenCalledWith(
        `${CLIENT_URL}/login`,
        HttpStatus.FOUND,
      );
    });

    // Nest leaves a `@Res()` handler's reply on 200, and a browser ignores
    // `location` on a 200 -- it would sit on the api url instead of bouncing.
    it('redirects with a status a browser will actually follow', async () => {
      const mocks = build();
      const controller = await makeController(mocks);

      await controller.logout(
        request(),
        mocks.reply as unknown as FastifyReply,
      );

      expect(mocks.reply.redirect.mock.calls[0][1]).toBe(HttpStatus.FOUND);
    });

    it('does not double the slash when CLIENT_URL has a trailing one', async () => {
      const mocks = build();
      const controller = await makeController(mocks, {
        CLIENT_URL: `${CLIENT_URL}/`,
      });

      await controller.logout(
        request(),
        mocks.reply as unknown as FastifyReply,
      );

      expect(mocks.reply.redirect).toHaveBeenCalledWith(
        `${CLIENT_URL}/login`,
        HttpStatus.FOUND,
      );
    });

    // Public on purpose: an already-dead session still needs its cookie cleared
    // rather than being turned away by the guard.
    it('still clears the cookie when there was no session to revoke', async () => {
      const mocks = build();
      const controller = await makeController(mocks);

      await controller.logout(
        request(),
        mocks.reply as unknown as FastifyReply,
      );

      expect(mocks.authService.logout).not.toHaveBeenCalled();
      expect(mocks.reply.clearCookie).toHaveBeenCalled();
      expect(mocks.reply.redirect).toHaveBeenCalled();
    });
  });
});
