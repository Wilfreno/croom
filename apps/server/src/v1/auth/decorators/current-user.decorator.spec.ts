import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';
import { CurrentUser } from './current-user.decorator';

/** Pulls out the function Nest runs to resolve `@CurrentUser()` for a request. */
function resolverOf(decorator: () => ParameterDecorator) {
  class Controller {
    handler(@decorator() _user: unknown) {}
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Controller, 'handler');
  const [{ factory }] = Object.values(args) as { factory: (data: unknown, ctx: ExecutionContext) => unknown }[];
  return factory;
}

function contextWith(request: object) {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('@CurrentUser()', () => {
  const resolve = resolverOf(CurrentUser);

  it('gives the user the session guard put on the request', () => {
    const user = { id: 'u1', email: 'a@b.co' };

    expect(resolve(undefined, contextWith({ user }))).toBe(user);
  });

  it('is undefined on a public route with no session', () => {
    expect(resolve(undefined, contextWith({}))).toBeUndefined();
  });
});
