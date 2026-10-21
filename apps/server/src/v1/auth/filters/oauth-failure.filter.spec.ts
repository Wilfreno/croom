import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAUTH_STATE_COOKIE } from '@repo/constants';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OAuthFailureFilter } from './oauth-failure.filter';

const CLIENT_URL = 'https://croom.app';

function build(clientUrl = CLIENT_URL) {
  const reply = { redirect: vi.fn(), clearCookie: vi.fn() };

  const host = {
    switchToHttp: () => ({ getResponse: () => reply }),
  } as unknown as ArgumentsHost;

  const filter = new OAuthFailureFilter({
    get: () => clientUrl,
  } as unknown as ConfigService);

  return { reply, host, filter };
}

describe('OAuthFailureFilter', () => {
  beforeEach(() => vi.clearAllMocks());

  // The oauth legs are browser navigations, so the app-wide json envelope would
  // be rendered as a page on the api's domain with no way back.
  it('sends the browser to the login page rather than answering with json', () => {
    const { filter, host, reply } = build();

    filter.catch(new Error('google said no'), host);

    expect(reply.redirect).toHaveBeenCalledWith(
      `${CLIENT_URL}/login?error=google`,
      HttpStatus.FOUND,
    );
  });

  it('clears the state cookie so a stale value cannot be reused', () => {
    const { filter, host, reply } = build();

    filter.catch(new Error('google said no'), host);

    expect(reply.clearCookie).toHaveBeenCalledWith(OAUTH_STATE_COOKIE, {
      path: '/v1/auth/google/callback',
    });
  });

  // Which part of the handshake failed is worth logging, not worth telling
  // whoever is probing it.
  it('does not pass the reason on to the browser', () => {
    const { filter, host, reply } = build();

    filter.catch(new Error('state did not match'), host);

    expect(reply.redirect.mock.calls[0][0]).not.toContain('state');
    expect(reply.redirect.mock.calls[0][0]).not.toContain('match');
  });

  it('does not double the slash when CLIENT_URL has a trailing one', () => {
    const { filter, host, reply } = build(`${CLIENT_URL}/`);

    filter.catch(new Error('google said no'), host);

    expect(reply.redirect).toHaveBeenCalledWith(
      `${CLIENT_URL}/login?error=google`,
      HttpStatus.FOUND,
    );
  });

  it('handles something thrown that is not an Error', () => {
    const { filter, host, reply } = build();

    expect(() => filter.catch('a string', host)).not.toThrow();
    expect(reply.redirect).toHaveBeenCalled();
  });
});
