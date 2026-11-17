import { GUARDS_METADATA } from '@nestjs/common/constants';
import {
  CONVERSATION_ADMIN_SOURCE_KEY,
  CONVERSATION_BLOCKED_SOURCE_KEY,
  ConversationAdminGuard,
  ConversationBlockedGuard,
} from '@repo/guards';
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
    addAdmin: vi.fn().mockResolvedValue({ memberId: 'ada' }),
    removeAdmin: vi.fn().mockResolvedValue({ memberId: 'ada' }),
    addMember: vi.fn().mockResolvedValue({ memberId: 'ada' }),
    removeMember: vi.fn().mockResolvedValue({ memberId: 'ada' }),
    leaveConversation: vi.fn().mockResolvedValue({ conversationId: 'c1', newAdminId: null }),
    changePhoto: vi.fn().mockResolvedValue({ photo: { id: 'p1', url: 'https://utfs.io/new.png' } }),
    changeName: vi.fn().mockResolvedValue({ name: 'Squad' }),
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

  it('adds an admin on behalf of the caller', async () => {
    const { controller, conversationService } = build();

    await expect(controller.addAdmin(USER, { conversationId: 'c1' }, { memberId: 'ada' })).resolves.toEqual({
      memberId: 'ada',
    });
    expect(conversationService.addAdmin).toHaveBeenCalledWith({ conversationId: 'c1', memberId: 'ada', requesterId: 'me' });
  });

  it('removes an admin on behalf of the caller', async () => {
    const { controller, conversationService } = build();

    await expect(controller.removeAdmin(USER, { conversationId: 'c1', memberId: 'ada' })).resolves.toEqual({
      memberId: 'ada',
    });
    expect(conversationService.removeAdmin).toHaveBeenCalledWith({
      conversationId: 'c1',
      memberId: 'ada',
      requesterId: 'me',
    });
  });

  it('adds a member on behalf of the caller', async () => {
    const { controller, conversationService } = build();

    await expect(controller.addMember(USER, { conversationId: 'c1' }, { memberId: 'ada' })).resolves.toEqual({
      memberId: 'ada',
    });
    expect(conversationService.addMember).toHaveBeenCalledWith({ conversationId: 'c1', memberId: 'ada', requesterId: 'me' });
  });

  it('removes a member on behalf of the caller', async () => {
    const { controller, conversationService } = build();

    await expect(controller.removeMember(USER, { conversationId: 'c1', memberId: 'ada' })).resolves.toEqual({
      memberId: 'ada',
    });
    expect(conversationService.removeMember).toHaveBeenCalledWith({
      conversationId: 'c1',
      memberId: 'ada',
      requesterId: 'me',
    });
  });

  it('leaves a conversation on behalf of the caller', async () => {
    const { controller, conversationService } = build();

    await expect(controller.leaveConversation(USER, { conversationId: 'c1' })).resolves.toEqual({
      conversationId: 'c1',
      newAdminId: null,
    });
    expect(conversationService.leaveConversation).toHaveBeenCalledWith({ conversationId: 'c1', userId: 'me' });
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

  it('changes the group photo as the current user', async () => {
    const { controller, conversationService } = build();
    const photo = { key: 'k', url: 'https://utfs.io/new.png' };

    await expect(controller.changePhoto(USER, { conversationId: 'c1' }, { photo })).resolves.toEqual({
      photo: { id: 'p1', url: 'https://utfs.io/new.png' },
    });
    expect(conversationService.changePhoto).toHaveBeenCalledWith({ conversationId: 'c1', photo, requesterId: 'me' });
  });

  it('renames the group as the current user', async () => {
    const { controller, conversationService } = build();

    await expect(controller.changeName(USER, { conversationId: 'c1' }, { name: 'Squad' })).resolves.toEqual({
      name: 'Squad',
    });
    expect(conversationService.changeName).toHaveBeenCalledWith({ conversationId: 'c1', name: 'Squad', requesterId: 'me' });
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

  describe('admin routes', () => {
    const route = (name: keyof ConversationController) => ConversationController.prototype[name] as object;

    it.each(['addAdmin', 'removeAdmin', 'addMember', 'removeMember', 'changePhoto', 'changeName'] as const)('only lets admins reach %s', (name) => {
      expect(Reflect.getMetadata(GUARDS_METADATA, route(name))).toContain(ConversationAdminGuard);
      expect(Reflect.getMetadata(CONVERSATION_ADMIN_SOURCE_KEY, route(name))).toEqual({ param: 'conversationId' });
    });
  });
});
