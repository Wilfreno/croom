import { BadRequestException, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { ConversationFirstMessageGuard, isFirstMessageRequest } from './conversation-first-message.guard';
import { ConversationGuardRequest } from './conversation-id.util';

const VALID_ID = '64b7f0c2a1b2c3d4e5f60718';
const OTHER_ID = '64b7f0c2a1b2c3d4e5f60719';

function contextFor(request: ConversationGuardRequest) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

function reflectorReturning(allowsFirstMessage: boolean | undefined) {
  return { getAllAndOverride: vi.fn().mockReturnValue(allowsFirstMessage) } as unknown as Reflector;
}

describe('isFirstMessageRequest', () => {
  const source = { body: 'conversationId' };

  it('is true when the route allows it and the body has no conversation id', () => {
    const context = contextFor({ body: { members: [OTHER_ID] } });

    expect(isFirstMessageRequest(context, reflectorReturning(true), source)).toBe(true);
  });

  it('treats a null conversation id as absent', () => {
    const context = contextFor({ body: { conversationId: null } });

    expect(isFirstMessageRequest(context, reflectorReturning(true), source)).toBe(true);
  });

  it('is true when there is no body at all', () => {
    expect(isFirstMessageRequest(contextFor({}), reflectorReturning(true), source)).toBe(true);
  });

  it('is false when the body has a conversation id, even a malformed one', () => {
    const context = contextFor({ body: { conversationId: 'not-an-id' } });

    expect(isFirstMessageRequest(context, reflectorReturning(true), source)).toBe(false);
  });

  it('is false when the route does not allow a first message', () => {
    const context = contextFor({ body: {} });

    expect(isFirstMessageRequest(context, reflectorReturning(undefined), source)).toBe(false);
    expect(isFirstMessageRequest(context, reflectorReturning(false), source)).toBe(false);
  });

  it('is false when the id comes from a route param', () => {
    const context = contextFor({ params: {} });

    expect(isFirstMessageRequest(context, reflectorReturning(true), { param: 'conversationId' })).toBe(false);
  });

  it('is false when there is no source', () => {
    expect(isFirstMessageRequest(contextFor({ body: {} }), reflectorReturning(true), undefined)).toBe(false);
  });
});

describe('ConversationFirstMessageGuard', () => {
  const guard = new ConversationFirstMessageGuard();
  const user = { id: VALID_ID };

  it('rejects a request with no session user', () => {
    expect(() => guard.canActivate(contextFor({ body: { conversationId: VALID_ID } }))).toThrow(
      UnauthorizedException,
    );
  });

  it('allows a follow-up message with only a conversation id', () => {
    expect(guard.canActivate(contextFor({ user, body: { conversationId: VALID_ID } }))).toBe(true);
  });

  it('rejects a body with both a conversation id and members', () => {
    const context = contextFor({ user, body: { conversationId: VALID_ID, members: [OTHER_ID] } });

    expect(() => guard.canActivate(context)).toThrow(BadRequestException);
  });

  it('allows a first message with a non-empty list of valid member ids', () => {
    expect(guard.canActivate(contextFor({ user, body: { members: [OTHER_ID, VALID_ID] } }))).toBe(true);
  });

  it.each([
    ['missing', undefined],
    ['not an array', OTHER_ID],
    ['empty', []],
    ['holding a malformed id', [OTHER_ID, 'nope']],
    ['holding a non-string', [OTHER_ID, 42]],
  ])('rejects a first message whose members are %s', (_, members) => {
    const context = contextFor({ user, body: { members } });

    expect(() => guard.canActivate(context)).toThrow(BadRequestException);
  });
});
