import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationStatus, MessageNoticeType } from '@repo/enums';
import { ConversationModel, MessageModel, PhotoModel, UserModel } from '@repo/models';
import { ClientSession, Connection, Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CallGateway } from '../call/call.gateway';
import { MessageGateway } from '../message/message.gateway';
import { ConversationService } from './conversation.service';

const ME = '64b7f0c2a1b2c3d4e5f60701';
const ADA = '64b7f0c2a1b2c3d4e5f60702';
const BOB = '64b7f0c2a1b2c3d4e5f60703';

const users = {
  [ME]: { id: ME, displayName: 'Me' },
  [ADA]: { id: ADA, displayName: 'Ada' },
  [BOB]: { id: BOB, displayName: 'Bob' },
};

const session = { id: 'session' } as unknown as ClientSession;

const NOTICE_ID = new Types.ObjectId('64b7f0c2a1b2c3d4e5f60799');
const NOTICE_PAYLOAD = { id: String(NOTICE_ID), notice: { type: 'NICKNAME', user: ADA, value: 'Ace' } };

type NewConversation = {
  name: string;
  isGroupChat: boolean;
  members: Types.ObjectId[];
  admins: Types.ObjectId[];
  nicknames: { user: Types.ObjectId; value: string }[];
};

function build() {
  const conversationModel = {
    checkConversationExistByMembers: vi.fn().mockResolvedValue(false),
    createConversation: vi.fn(async (data: NewConversation, _session: ClientSession) => ({ _id: 'new', ...data })),
    findConversationByMembers: vi.fn().mockResolvedValue({ id: 'c1' }),
    findConversationPayloadById: vi.fn().mockResolvedValue({ id: 'c1' }),
    findConversationById: vi.fn().mockResolvedValue({ isGroupChat: false, members: [ME, ADA] }),
    blockConversation: vi.fn().mockResolvedValue(true),
    unblockConversation: vi.fn().mockResolvedValue(true),
    setNickname: vi.fn().mockResolvedValue({ found: true, changed: true }),
    addAdmin: vi.fn().mockResolvedValue(true),
    removeAdmin: vi.fn().mockResolvedValue(true),
    addMember: vi.fn().mockResolvedValue(true),
    removeMember: vi.fn().mockResolvedValue(true),
  };
  const userModel = {
    getUsersByIds: vi.fn(async (ids: string[]) => ids.filter((id) => id in users).map((id) => users[id])),
  };
  const messageModel = {
    getMessagesByConversationId: vi.fn().mockResolvedValue([]),
    createMessage: vi.fn().mockResolvedValue({ _id: NOTICE_ID }),
    findMessagePayloadById: vi.fn().mockResolvedValue(NOTICE_PAYLOAD),
  };
  const photoModel = { getPhotosByConversationId: vi.fn().mockResolvedValue([]) };

  const callGateway = { endCall: vi.fn().mockResolvedValue(undefined) };
  const messageGateway = { emitToUsers: vi.fn() };
  const transaction = {
    withTransaction: vi.fn(async (work: () => Promise<void>) => work()),
    endSession: vi.fn().mockResolvedValue(undefined),
  };
  const connection = { startSession: vi.fn().mockResolvedValue(transaction) };

  const service = new ConversationService(
    conversationModel as unknown as ConversationModel,
    userModel as unknown as UserModel,
    messageModel as unknown as MessageModel,
    photoModel as unknown as PhotoModel,
    callGateway as unknown as CallGateway,
    connection as unknown as Connection,
    messageGateway as unknown as MessageGateway,
  );

  return {
    service,
    conversationModel,
    userModel,
    messageModel,
    photoModel,
    callGateway,
    messageGateway,
    transaction,
  };
}

const ids = (values: unknown[]) => values.map(String);

describe('ConversationService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    it('refuses a second one-to-one conversation between the same two people', async () => {
      const { service, conversationModel } = build();
      conversationModel.checkConversationExistByMembers.mockResolvedValue(true);

      await expect(service.create({ members: [ADA, ME], userId: ME }, session)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(conversationModel.checkConversationExistByMembers).toHaveBeenCalledWith([ADA, ME]);
      expect(conversationModel.createConversation).not.toHaveBeenCalled();
    });

    it('does not check for an existing conversation when creating a group', async () => {
      const { service, conversationModel } = build();

      await service.create({ members: [ADA, BOB, ME], userId: ME }, session);

      expect(conversationModel.checkConversationExistByMembers).not.toHaveBeenCalled();
    });

    it('names the member that does not exist', async () => {
      const { service, conversationModel } = build();
      const ghost = '64b7f0c2a1b2c3d4e5f60799';

      await expect(service.create({ members: [ghost, ME], userId: ME }, session)).rejects.toThrow(
        new NotFoundException(`user with id:${ghost} does not exist`),
      );
      expect(conversationModel.createConversation).not.toHaveBeenCalled();
    });

    it('creates an unnamed one-to-one conversation where both members are admins', async () => {
      const { service, conversationModel } = build();

      await service.create({ members: [ADA, ME], userId: ME }, session);

      const [data, passedSession] = conversationModel.createConversation.mock.calls[0];
      expect(passedSession).toBe(session);
      expect(data.name).toBe('');
      expect(data.isGroupChat).toBe(false);
      expect(ids(data.members)).toEqual([ADA, ME]);
      expect(ids(data.admins)).toEqual([ADA, ME]);
      expect(data.members[0]).toBeInstanceOf(Types.ObjectId);
    });

    it("names a group after its members and makes only the creator an admin", async () => {
      const { service, conversationModel } = build();

      await service.create({ members: [ADA, BOB, ME], userId: ME }, session);

      const [data] = conversationModel.createConversation.mock.calls[0];
      expect(data.name).toBe('Ada, Bob, Me');
      expect(data.isGroupChat).toBe(true);
      expect(ids(data.admins)).toEqual([ME]);
    });

    it('starts every member with an empty nickname', async () => {
      const { service, conversationModel } = build();

      await service.create({ members: [ADA, ME], userId: ME }, session);

      const [data] = conversationModel.createConversation.mock.calls[0];
      expect(data.nicknames.map(({ user, value }) => [String(user), value])).toEqual([
        [ADA, ''],
        [ME, ''],
      ]);
    });

    it('returns the conversation it created', async () => {
      const { service } = build();

      await expect(service.create({ members: [ADA, ME], userId: ME }, session)).resolves.toMatchObject({
        _id: 'new',
      });
    });
  });

  describe('getConversationMessages', () => {
    it.each([
      ['1', 0],
      ['3', 30],
    ])('reads page %s fifteen at a time', async (page, skip) => {
      const { service, messageModel } = build();

      await service.getConversationMessages({ conversationId: 'c1', page: page as never });

      expect(messageModel.getMessagesByConversationId).toHaveBeenCalledWith({
        conversationId: 'c1',
        limit: 15,
        skip,
      });
    });
  });

  it('looks a conversation up by the given members plus the caller', async () => {
    const { service, conversationModel } = build();

    await expect(service.getConversationByMembersId([ADA], ME)).resolves.toEqual({ id: 'c1' });
    expect(conversationModel.findConversationByMembers).toHaveBeenCalledWith([ADA, ME], ME);
  });

  it('reads a conversation payload by id', async () => {
    const { service, conversationModel } = build();

    await expect(service.getConversationById('c1')).resolves.toEqual({ id: 'c1' });
    expect(conversationModel.findConversationPayloadById).toHaveBeenCalledWith('c1');
  });

  it("reads a conversation's media", async () => {
    const { service, photoModel } = build();

    await service.getConversationMedia('c1');

    expect(photoModel.getPhotosByConversationId).toHaveBeenCalledWith('c1');
  });

  describe('blockConversation', () => {
    const query = { conversationId: 'c1', userId: ME };

    it('blocks a one-to-one conversation for the caller', async () => {
      const { service, conversationModel } = build();

      await service.blockConversation(query);

      expect(conversationModel.findConversationById).toHaveBeenCalledWith('c1');
      expect(conversationModel.blockConversation).toHaveBeenCalledWith(query);
    });

    it('ends a call that is still running in the conversation', async () => {
      const { service, callGateway } = build();

      await service.blockConversation(query);

      expect(callGateway.endCall).toHaveBeenCalledWith('c1', 'this conversation was blocked');
    });

    it.each([
      ['a missing conversation', null, NotFoundException],
      ['a deleted conversation', { isGroupChat: false, members: [ME, ADA], status: ConversationStatus.DELETED }, NotFoundException],
      ['a group', { isGroupChat: true, members: [ME, ADA, BOB] }, BadRequestException],
      ['a group that shrank to two members', { isGroupChat: true, members: [ME, ADA] }, BadRequestException],
      [
        'an already blocked conversation',
        { isGroupChat: false, members: [ME, ADA], status: ConversationStatus.BLOCKED, blocker: ADA },
        ConflictException,
      ],
    ])('refuses %s', async (_, conversation, exception) => {
      const { service, conversationModel, callGateway } = build();
      conversationModel.findConversationById.mockResolvedValue(conversation);

      await expect(service.blockConversation(query)).rejects.toBeInstanceOf(exception);
      expect(conversationModel.blockConversation).not.toHaveBeenCalled();
      expect(callGateway.endCall).not.toHaveBeenCalled();
    });

    it('reports a conflict when the other member blocked first', async () => {
      const { service, conversationModel } = build();
      conversationModel.blockConversation.mockResolvedValue(false);

      await expect(service.blockConversation(query)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('addAdmin', () => {
    const query = { conversationId: 'c1', memberId: BOB, requesterId: ME };
    const group = { isGroupChat: true, members: [ME, ADA, BOB], admins: [ME] };

    it('makes a group member an admin when the caller is an admin', async () => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue(group);

      await expect(service.addAdmin(query)).resolves.toEqual({ memberId: BOB });
      expect(conversationModel.addAdmin).toHaveBeenCalledWith({ conversationId: 'c1', memberId: BOB, requesterId: ME });
    });

    it.each([
      ['a missing conversation', null, query, NotFoundException],
      ['a deleted conversation', { ...group, status: ConversationStatus.DELETED }, query, NotFoundException],
      ['a one-to-one conversation', { isGroupChat: false, members: [ME, ADA], admins: [ME, ADA] }, { ...query, memberId: ADA }, BadRequestException],
      ['someone outside the group', { isGroupChat: true, members: [ME, ADA, 'someone-else'], admins: [ME] }, query, NotFoundException],
      ['someone who is already an admin', { ...group, admins: [ME, BOB] }, query, ConflictException],
    ])('refuses %s', async (_, conversation, input, exception) => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue(conversation);

      await expect(service.addAdmin(input)).rejects.toBeInstanceOf(exception);
      expect(conversationModel.addAdmin).not.toHaveBeenCalled();
    });

    it('reports a conflict when the admins changed in the meantime', async () => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue(group);
      conversationModel.addAdmin.mockResolvedValue(false);

      await expect(service.addAdmin(query)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('removeAdmin', () => {
    const query = { conversationId: 'c1', memberId: BOB, requesterId: ME };
    const group = { isGroupChat: true, members: [ME, ADA, BOB], admins: [ME, BOB] };

    it('removes another admin when the caller is an admin', async () => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue(group);

      await expect(service.removeAdmin(query)).resolves.toEqual({ memberId: BOB });
      expect(conversationModel.removeAdmin).toHaveBeenCalledWith({ conversationId: 'c1', memberId: BOB, requesterId: ME });
    });

    it.each([
      ['a missing conversation', null, query, NotFoundException],
      ['a one-to-one conversation', { isGroupChat: false, members: [ME, ADA], admins: [ME, ADA] }, { ...query, memberId: ADA }, BadRequestException],
      ['someone who is not an admin', { ...group, admins: [ME] }, query, ConflictException],
      ['the last admin', { ...group, admins: [ME] }, { ...query, memberId: ME }, ConflictException],
    ])('refuses %s', async (_, conversation, input, exception) => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue(conversation);

      await expect(service.removeAdmin(input)).rejects.toBeInstanceOf(exception);
      expect(conversationModel.removeAdmin).not.toHaveBeenCalled();
    });

    it('reports a conflict when the admins changed in the meantime', async () => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue(group);
      conversationModel.removeAdmin.mockResolvedValue(false);

      await expect(service.removeAdmin(query)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('addMember', () => {
    const query = { conversationId: 'c1', memberId: BOB, requesterId: ME };
    const group = { isGroupChat: true, members: [ME, ADA, 'someone-else'], admins: [ME] };

    it('adds an existing user to the group', async () => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue(group);

      await expect(service.addMember(query)).resolves.toEqual({ memberId: BOB });
      expect(conversationModel.addMember).toHaveBeenCalledWith({ conversationId: 'c1', memberId: BOB, requesterId: ME });
    });

    it.each([
      ['a missing conversation', null, query, NotFoundException],
      ['a deleted conversation', { ...group, status: ConversationStatus.DELETED }, query, NotFoundException],
      ['a one-to-one conversation', { isGroupChat: false, members: [ME, ADA], admins: [ME, ADA] }, query, BadRequestException],
      ['someone who is already a member', group, { ...query, memberId: ADA }, ConflictException],
      ['a user that does not exist', group, { ...query, memberId: '64b7f0c2a1b2c3d4e5f607ff' }, NotFoundException],
    ])('refuses %s', async (_, conversation, input, exception) => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue(conversation);

      await expect(service.addMember(input)).rejects.toBeInstanceOf(exception);
      expect(conversationModel.addMember).not.toHaveBeenCalled();
    });

    it('reports a conflict when the members changed in the meantime', async () => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue(group);
      conversationModel.addMember.mockResolvedValue(false);

      await expect(service.addMember(query)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('removeMember', () => {
    const query = { conversationId: 'c1', memberId: BOB, requesterId: ME };
    const group = { isGroupChat: true, members: [ME, ADA, BOB, 'someone-else'], admins: [ME, BOB] };

    it('removes a member, admin or not, when the caller is an admin', async () => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue(group);

      await expect(service.removeMember(query)).resolves.toEqual({ memberId: BOB });
      expect(conversationModel.removeMember).toHaveBeenCalledWith({ conversationId: 'c1', memberId: BOB, requesterId: ME });
    });

    it('still treats the conversation as a group when only two members would remain', async () => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue({ ...group, members: [ME, BOB] });

      await expect(service.removeMember(query)).resolves.toEqual({ memberId: BOB });
      expect(conversationModel.removeMember).toHaveBeenCalled();
    });

    it.each([
      ['the caller themselves', group, { ...query, memberId: ME }, BadRequestException],
      ['a missing conversation', null, query, NotFoundException],
      ['a deleted conversation', { ...group, status: ConversationStatus.DELETED }, query, NotFoundException],
      ['a one-to-one conversation', { isGroupChat: false, members: [ME, BOB], admins: [ME, BOB] }, query, BadRequestException],
      ['someone outside the group', { ...group, members: [ME, ADA, 'x', 'y'] }, query, NotFoundException],
    ])('refuses %s', async (_, conversation, input, exception) => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue(conversation);

      await expect(service.removeMember(input)).rejects.toBeInstanceOf(exception);
      expect(conversationModel.removeMember).not.toHaveBeenCalled();
    });

    it('reports a conflict when the members changed in the meantime', async () => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue(group);
      conversationModel.removeMember.mockResolvedValue(false);

      await expect(service.removeMember(query)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('setNickname', () => {
    const CONVO = '64b7f0c2a1b2c3d4e5f60710';
    const query = { conversationId: CONVO, user: ADA, value: 'Ace', userId: ME };

    it('sets the nickname and posts a notice from the caller in the same transaction', async () => {
      const { service, conversationModel, messageModel, transaction } = build();

      await service.setNickname(query);

      expect(conversationModel.setNickname).toHaveBeenCalledWith(
        { conversationId: CONVO, userId: ADA, value: 'Ace' },
        transaction,
      );
      const [notice, noticeSession] = messageModel.createMessage.mock.calls[0];
      expect(noticeSession).toBe(transaction);
      expect(String(notice.conversation)).toBe(CONVO);
      expect(String(notice.sender)).toBe(ME);
      expect(notice.notice.type).toBe(MessageNoticeType.NICKNAME);
      expect(String(notice.notice.user)).toBe(ADA);
      expect(notice.notice.value).toBe('Ace');
      expect(transaction.endSession).toHaveBeenCalled();
    });

    it('sends the notice to everyone else in the conversation and returns it', async () => {
      const { service, messageModel, messageGateway } = build();

      await expect(service.setNickname(query)).resolves.toEqual({ user: ADA, value: 'Ace', message: NOTICE_PAYLOAD });
      expect(messageModel.findMessagePayloadById).toHaveBeenCalledWith(NOTICE_ID);
      expect(messageGateway.emitToUsers).toHaveBeenCalledWith([ADA], 'MESSAGE', NOTICE_PAYLOAD);
    });

    it('posts no notice when the nickname did not change', async () => {
      const { service, conversationModel, messageModel, messageGateway } = build();
      conversationModel.setNickname.mockResolvedValue({ found: true, changed: false });

      await expect(service.setNickname(query)).resolves.toEqual({ user: ADA, value: 'Ace', message: null });
      expect(messageModel.createMessage).not.toHaveBeenCalled();
      expect(messageGateway.emitToUsers).not.toHaveBeenCalled();
    });

    it('refuses someone who is not in the conversation', async () => {
      const { service, conversationModel, messageModel, transaction } = build();
      conversationModel.setNickname.mockResolvedValue({ found: false, changed: false });

      await expect(service.setNickname({ ...query, user: BOB })).rejects.toBeInstanceOf(NotFoundException);
      expect(messageModel.createMessage).not.toHaveBeenCalled();
      expect(transaction.endSession).toHaveBeenCalled();
    });

    it('refuses a missing conversation', async () => {
      const { service, conversationModel, messageGateway } = build();
      conversationModel.findConversationById.mockResolvedValue(null);

      await expect(service.setNickname(query)).rejects.toBeInstanceOf(NotFoundException);
      expect(conversationModel.setNickname).not.toHaveBeenCalled();
      expect(messageGateway.emitToUsers).not.toHaveBeenCalled();
    });
  });

  describe('unblockConversation', () => {
    const query = { conversationId: 'c1', userId: ME };
    const blockedBy = (blocker: string) => ({
      members: [ME, ADA],
      status: ConversationStatus.BLOCKED,
      blocker: new Types.ObjectId(blocker),
    });

    it('lets the blocker unblock', async () => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue(blockedBy(ME));

      await service.unblockConversation(query);

      expect(conversationModel.unblockConversation).toHaveBeenCalledWith(query);
    });

    it('does not let the blocked member unblock themselves', async () => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue(blockedBy(ADA));

      await expect(service.unblockConversation(query)).rejects.toBeInstanceOf(ForbiddenException);
      expect(conversationModel.unblockConversation).not.toHaveBeenCalled();
    });

    it('refuses a missing or unblocked conversation', async () => {
      const { service, conversationModel } = build();

      conversationModel.findConversationById.mockResolvedValue(null);
      await expect(service.unblockConversation(query)).rejects.toBeInstanceOf(NotFoundException);

      conversationModel.findConversationById.mockResolvedValue({ members: [ME, ADA] });
      await expect(service.unblockConversation(query)).rejects.toBeInstanceOf(ConflictException);
      expect(conversationModel.unblockConversation).not.toHaveBeenCalled();
    });
  });
});
