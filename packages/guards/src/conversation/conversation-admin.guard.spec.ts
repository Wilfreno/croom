import { BadRequestException, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConversationModel } from '@repo/models';
import { describe, expect, it, vi } from 'vitest';
import { CONVERSATION_ADMIN_SOURCE_KEY, ConversationAdminGuard } from './conversation-admin.guard';
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

function build({ source, isAdmin = true }: { source: ConversationIdSource | undefined; isAdmin?: boolean }) {
  const metadata: Record<string, unknown> = { [CONVERSATION_ADMIN_SOURCE_KEY]: source };
  const reflector = { getAllAndOverride: vi.fn((key: string) => metadata[key]) } as unknown as Reflector;
  const conversationModel = { isConversationAdmin: vi.fn().mockResolvedValue(isAdmin) };

  return {
    guard: new ConversationAdminGuard(reflector, conversationModel as unknown as ConversationModel),
    conversationModel,
  };
}

describe('ConversationAdminGuard', () => {
  it('lets an admin through, checking the id from the configured source', async () => {
    const { guard, conversationModel } = build({ source: { param: 'conversationId' } });
    const context = contextFor({ user: { id: USER_ID }, params: { conversationId: CONVERSATION_ID } });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(conversationModel.isConversationAdmin).toHaveBeenCalledWith({
      conversationId: CONVERSATION_ID,
      userId: USER_ID,
    });
  });

  it('rejects someone who is not an admin with 403', async () => {
    const { guard } = build({ source: { body: 'conversationId' }, isAdmin: false });
    const context = contextFor({ user: { id: USER_ID }, body: { conversationId: CONVERSATION_ID } });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a request with no session user before querying', async () => {
    const { guard, conversationModel } = build({ source: { param: 'conversationId' } });
    const context = contextFor({ params: { conversationId: CONVERSATION_ID } });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(conversationModel.isConversationAdmin).not.toHaveBeenCalled();
  });

  it('rejects a malformed conversation id with 400 before querying', async () => {
    const { guard, conversationModel } = build({ source: { param: 'conversationId' } });
    const context = contextFor({ user: { id: USER_ID }, params: { conversationId: 'bad' } });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(BadRequestException);
    expect(conversationModel.isConversationAdmin).not.toHaveBeenCalled();
  });

  it('fails loudly when applied without its decorator', async () => {
    const { guard } = build({ source: undefined });
    const context = contextFor({ user: { id: USER_ID }, params: { conversationId: CONVERSATION_ID } });

    await expect(guard.canActivate(context)).rejects.toThrow(/ConversationAdminGuard/);
  });
});
