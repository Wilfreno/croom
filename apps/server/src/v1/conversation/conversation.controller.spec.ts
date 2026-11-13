import type { AuthenticatedUser } from '@repo/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

const USER = { id: 'me' } as AuthenticatedUser;

function build() {
  const conversationService = {
    getConversationMessages: vi.fn().mockResolvedValue(['messages']),
    getConversationByMembersId: vi.fn().mockResolvedValue({ id: 'by-members' }),
    getConversationById: vi.fn().mockResolvedValue({ id: 'c1' }),
    getConversationMedia: vi.fn().mockResolvedValue(['media']),
  };
  const controller = new ConversationController(conversationService as unknown as ConversationService);
  return { controller, conversationService };
}

describe('ConversationController', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes the conversation and page through for messages', async () => {
    const { controller, conversationService } = build();

    await expect(
      controller.getConversationMessages({ conversationId: 'c1' }, { page: 2 } as never),
    ).resolves.toEqual(['messages']);
    expect(conversationService.getConversationMessages).toHaveBeenCalledWith({ conversationId: 'c1', page: 2 });
  });

  it('finds a conversation by members on behalf of the caller', async () => {
    const { controller, conversationService } = build();

    await expect(controller.getConversationByMembersId(USER, { members: ['ada'] })).resolves.toEqual({
      id: 'by-members',
    });
    expect(conversationService.getConversationByMembersId).toHaveBeenCalledWith(['ada'], 'me');
  });

  it('reads a conversation by id', async () => {
    const { controller, conversationService } = build();

    await expect(controller.getConversationById({ conversationId: 'c1' })).resolves.toEqual({ id: 'c1' });
    expect(conversationService.getConversationById).toHaveBeenCalledWith('c1');
  });

  it("reads a conversation's media", async () => {
    const { controller, conversationService } = build();

    await expect(controller.getConversationMedia({ conversationId: 'c1' })).resolves.toEqual(['media']);
    expect(conversationService.getConversationMedia).toHaveBeenCalledWith('c1');
  });
});
