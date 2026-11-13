import { BadRequestException, ExecutionContext, HttpException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConversationModel } from '@repo/models';
import { describe, expect, it, vi } from 'vitest';
import { CONVERSATION_BLOCKED_SOURCE_KEY, ConversationBlockedGuard } from './conversation-blocked.guard';
import { CONVERSATION_FIRST_MESSAGE_KEY } from './conversation-first-message.guard';
import { ConversationGuardRequest, ConversationIdSource } from './conversation-id.util';

const CONVERSATION_ID = '64b7f0c2a1b2c3d4e5f60718';
const USER_ID = '64b7f0c2a1b2c3d4e5f60719';

function contextFor(request: ConversationGuardRequest) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

function build({
  source,
  allowsFirstMessage,
  isBlocked = false,
}: {
  source: ConversationIdSource | undefined;
  allowsFirstMessage?: boolean;
  isBlocked?: boolean;
}) {
  const metadata: Record<string, unknown> = {
    [CONVERSATION_BLOCKED_SOURCE_KEY]: source,
    [CONVERSATION_FIRST_MESSAGE_KEY]: allowsFirstMessage,
  };
  const reflector = { getAllAndOverride: vi.fn((key: string) => metadata[key]) } as unknown as Reflector;
  const conversationModel = { isUserBlockedInConversation: vi.fn().mockResolvedValue(isBlocked) };

  return {
    guard: new ConversationBlockedGuard(reflector, conversationModel as unknown as ConversationModel),
    conversationModel,
  };
}

describe('ConversationBlockedGuard', () => {
  it('lets a user who is not blocked through', async () => {
    const { guard, conversationModel } = build({ source: { body: 'conversationId' } });
    const context = contextFor({ user: { id: USER_ID }, body: { conversationId: CONVERSATION_ID } });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(conversationModel.isUserBlockedInConversation).toHaveBeenCalledWith({
      conversationId: CONVERSATION_ID,
      userId: USER_ID,
    });
  });

  it('rejects a blocked user with 423', async () => {
    const { guard } = build({ source: { param: 'conversationId' }, isBlocked: true });
    const context = contextFor({ user: { id: USER_ID }, params: { conversationId: CONVERSATION_ID } });

    const error = await guard.canActivate(context).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(423);
  });

  it('rejects a request with no session user before querying', async () => {
    const { guard, conversationModel } = build({ source: { body: 'conversationId' } });
    const context = contextFor({ body: { conversationId: CONVERSATION_ID } });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(conversationModel.isUserBlockedInConversation).not.toHaveBeenCalled();
  });

  it('rejects a malformed conversation id with 400 before querying', async () => {
    const { guard, conversationModel } = build({ source: { param: 'conversationId' } });
    const context = contextFor({ user: { id: USER_ID }, params: { conversationId: '123' } });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(BadRequestException);
    expect(conversationModel.isUserBlockedInConversation).not.toHaveBeenCalled();
  });

  it('passes a first message of a not-yet-created conversation without querying', async () => {
    const { guard, conversationModel } = build({ source: { body: 'conversationId' }, allowsFirstMessage: true });
    const context = contextFor({ user: { id: USER_ID }, body: { members: [CONVERSATION_ID] } });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(conversationModel.isUserBlockedInConversation).not.toHaveBeenCalled();
  });

  it('fails loudly when applied without its decorator', async () => {
    const { guard } = build({ source: undefined });
    const context = contextFor({ user: { id: USER_ID }, body: { conversationId: CONVERSATION_ID } });

    await expect(guard.canActivate(context)).rejects.toThrow(/ConversationBlockedGuard/);
  });
});
