import { BadRequestException, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConversationModel } from '@repo/models';
import { describe, expect, it, vi } from 'vitest';
import { CONVERSATION_FIRST_MESSAGE_KEY } from './conversation-first-message.guard';
import { ConversationGuardRequest, ConversationIdSource } from './conversation-id.util';
import { CONVERSATION_MEMBER_SOURCE_KEY, ConversationMemberGuard } from './conversation-member.guard';

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
  isMember = true,
}: {
  source: ConversationIdSource | undefined;
  allowsFirstMessage?: boolean;
  isMember?: boolean;
}) {
  const metadata: Record<string, unknown> = {
    [CONVERSATION_MEMBER_SOURCE_KEY]: source,
    [CONVERSATION_FIRST_MESSAGE_KEY]: allowsFirstMessage,
  };
  const reflector = { getAllAndOverride: vi.fn((key: string) => metadata[key]) } as unknown as Reflector;
  const conversationModel = { isConversationMember: vi.fn().mockResolvedValue(isMember) };

  return {
    guard: new ConversationMemberGuard(reflector, conversationModel as unknown as ConversationModel),
    conversationModel,
  };
}

describe('ConversationMemberGuard', () => {
  it('lets a member through, checking the id from the configured source', async () => {
    const { guard, conversationModel } = build({ source: { param: 'conversationId' } });
    const context = contextFor({ user: { id: USER_ID }, params: { conversationId: CONVERSATION_ID } });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(conversationModel.isConversationMember).toHaveBeenCalledWith({
      conversationId: CONVERSATION_ID,
      userId: USER_ID,
    });
  });

  it('rejects a non-member with 403', async () => {
    const { guard } = build({ source: { body: 'conversationId' }, isMember: false });
    const context = contextFor({ user: { id: USER_ID }, body: { conversationId: CONVERSATION_ID } });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a request with no session user before querying', async () => {
    const { guard, conversationModel } = build({ source: { body: 'conversationId' } });
    const context = contextFor({ body: { conversationId: CONVERSATION_ID } });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(conversationModel.isConversationMember).not.toHaveBeenCalled();
  });

  it('rejects a malformed conversation id with 400 before querying', async () => {
    const { guard, conversationModel } = build({ source: { body: 'conversationId' } });
    const context = contextFor({ user: { id: USER_ID }, body: { conversationId: 'bad' } });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(BadRequestException);
    expect(conversationModel.isConversationMember).not.toHaveBeenCalled();
  });

  it('passes a first message of a not-yet-created conversation without querying', async () => {
    const { guard, conversationModel } = build({ source: { body: 'conversationId' }, allowsFirstMessage: true });
    const context = contextFor({ user: { id: USER_ID }, body: { members: [CONVERSATION_ID] } });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(conversationModel.isConversationMember).not.toHaveBeenCalled();
  });

  it('still checks membership when a first-message route gets a conversation id', async () => {
    const { guard } = build({ source: { body: 'conversationId' }, allowsFirstMessage: true, isMember: false });
    const context = contextFor({ user: { id: USER_ID }, body: { conversationId: CONVERSATION_ID } });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('fails loudly when applied without its decorator', async () => {
    const { guard } = build({ source: undefined });
    const context = contextFor({ user: { id: USER_ID }, body: { conversationId: CONVERSATION_ID } });

    await expect(guard.canActivate(context)).rejects.toThrow(/ConversationMemberGuard/);
  });
});
