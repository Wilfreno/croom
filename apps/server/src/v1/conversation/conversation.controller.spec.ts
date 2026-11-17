import { GUARDS_METADATA } from '@nestjs/common/constants';
import { CONVERSATION_BLOCKED_SOURCE_KEY, ConversationBlockedGuard } from '@repo/guards';
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
    blockConversation: vi.fn().mockResolvedValue(undefined),
    unblockConversation: vi.fn().mockResolvedValue(undefined),
    setNickname: vi.fn().mockResolvedValue({ user: 'ada', value: 'Ace' }),
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

  it('sets a nickname on behalf of the caller', async () => {
    const { controller, conversationService } = build();

    await expect(controller.setNickname(USER, { conversationId: 'c1' }, { user: 'ada', value: 'Ace' })).resolves.toEqual({
      user: 'ada',
      value: 'Ace',
    });
    expect(conversationService.setNickname).toHaveBeenCalledWith({
      conversationId: 'c1',
      user: 'ada',
      value: 'Ace',
      userId: 'me',
    });
  });

  it('blocks a conversation on behalf of the caller', async () => {
    const { controller, conversationService } = build();

    await controller.blockConversation(USER, { conversationId: 'c1' });

    expect(conversationService.blockConversation).toHaveBeenCalledWith({ conversationId: 'c1', userId: 'me' });
  });

  it('unblocks a conversation on behalf of the caller', async () => {
    const { controller, conversationService } = build();

    await controller.unblockConversation(USER, { conversationId: 'c1' });

    expect(conversationService.unblockConversation).toHaveBeenCalledWith({ conversationId: 'c1', userId: 'me' });
  });

  describe('blocked members', () => {
    const route = (name: keyof ConversationController) => ConversationController.prototype[name] as object;
    const isBlockGuarded = (name: keyof ConversationController) =>
      Boolean(Reflect.getMetadata(GUARDS_METADATA, route(name))?.includes(ConversationBlockedGuard)) &&
      Reflect.getMetadata(CONVERSATION_BLOCKED_SOURCE_KEY, route(name)) !== undefined;

    it.each(['getConversationById', 'getConversationMessages'] as const)('can still read through %s', (name) => {
      expect(isBlockGuarded(name)).toBe(false);
    });

    it.each(['getConversationMedia', 'setNickname'] as const)('is still kept out of %s', (name) => {
      expect(isBlockGuarded(name)).toBe(true);
    });

    it.each(['blockConversation', 'unblockConversation'] as const)(
      'reaches %s, where the service decides who may act',
      (name) => {
        expect(isBlockGuarded(name)).toBe(false);
      },
    );
  });
});
