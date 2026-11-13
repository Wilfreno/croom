import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ConversationGuardRequest, getConversationGuardRequest, getConversationId } from './conversation-id.util';

const VALID_ID = '64b7f0c2a1b2c3d4e5f60718';

function contextFor(request: ConversationGuardRequest) {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('getConversationGuardRequest', () => {
  it('returns the HTTP request', () => {
    const request = { user: { id: '1' } };

    expect(getConversationGuardRequest(contextFor(request))).toBe(request);
  });
});

describe('getConversationId', () => {
  it('reads the id from a route param', () => {
    const context = contextFor({ params: { conversationId: VALID_ID } });

    expect(getConversationId(context, { param: 'conversationId' }, 'Guard')).toBe(VALID_ID);
  });

  it('reads the id from a body field', () => {
    const context = contextFor({ body: { id: VALID_ID } });

    expect(getConversationId(context, { body: 'id' }, 'Guard')).toBe(VALID_ID);
  });

  it('accepts an uppercase hex id', () => {
    const context = contextFor({ body: { id: VALID_ID.toUpperCase() } });

    expect(getConversationId(context, { body: 'id' }, 'Guard')).toBe(VALID_ID.toUpperCase());
  });

  it('does not read a body field when the source is a param', () => {
    const context = contextFor({ body: { conversationId: VALID_ID } });

    expect(() => getConversationId(context, { param: 'conversationId' }, 'Guard')).toThrow(BadRequestException);
  });

  it.each([
    ['missing', undefined],
    ['not a string', 123],
    ['too short', VALID_ID.slice(1)],
    ['too long', VALID_ID + '0'],
    ['not hex', 'z'.repeat(24)],
  ])('rejects an id that is %s with a 400 naming the field', (_, value) => {
    const context = contextFor({ body: { conversationId: value } });

    expect(() => getConversationId(context, { body: 'conversationId' }, 'Guard')).toThrow(
      new BadRequestException('conversationId must be a valid id'),
    );
  });

  it('throws a programming error, not a 400, when the source is missing', () => {
    const context = contextFor({ body: { conversationId: VALID_ID } });

    let thrown: unknown;
    try {
      getConversationId(context, undefined, 'MyGuard');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect(thrown).not.toBeInstanceOf(BadRequestException);
    expect((thrown as Error).message).toContain('MyGuard');
  });
});
