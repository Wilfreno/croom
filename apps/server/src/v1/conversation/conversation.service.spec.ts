import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationStatus } from '@repo/enums';
import { ConversationModel, MessageModel, PhotoModel, UserModel } from '@repo/models';
import { ClientSession, Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

type NewConversation = {
  name: string;
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
    findConversationById: vi.fn().mockResolvedValue({ members: [ME, ADA] }),
    blockConversation: vi.fn().mockResolvedValue(true),
    unblockConversation: vi.fn().mockResolvedValue(true),
  };
  const userModel = {
    getUsersByIds: vi.fn(async (ids: string[]) => ids.filter((id) => id in users).map((id) => users[id])),
  };
  const messageModel = { getMessagesByConversationId: vi.fn().mockResolvedValue([]) };
  const photoModel = { getPhotosByConversationId: vi.fn().mockResolvedValue([]) };

  const service = new ConversationService(
    conversationModel as unknown as ConversationModel,
    userModel as unknown as UserModel,
    messageModel as unknown as MessageModel,
    photoModel as unknown as PhotoModel,
  );

  return { service, conversationModel, userModel, messageModel, photoModel };
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
      expect(ids(data.members)).toEqual([ADA, ME]);
      expect(ids(data.admins)).toEqual([ADA, ME]);
      expect(data.members[0]).toBeInstanceOf(Types.ObjectId);
    });

    it("names a group after its members and makes only the creator an admin", async () => {
      const { service, conversationModel } = build();

      await service.create({ members: [ADA, BOB, ME], userId: ME }, session);

      const [data] = conversationModel.createConversation.mock.calls[0];
      expect(data.name).toBe('Ada, Bob, Me');
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

    it.each([
      ['a missing conversation', null, NotFoundException],
      ['a deleted conversation', { members: [ME, ADA], status: ConversationStatus.DELETED }, NotFoundException],
      ['a group', { members: [ME, ADA, BOB] }, BadRequestException],
      ['an already blocked conversation', { members: [ME, ADA], status: ConversationStatus.BLOCKED, blocker: ADA }, ConflictException],
    ])('refuses %s', async (_, conversation, exception) => {
      const { service, conversationModel } = build();
      conversationModel.findConversationById.mockResolvedValue(conversation);

      await expect(service.blockConversation(query)).rejects.toBeInstanceOf(exception);
      expect(conversationModel.blockConversation).not.toHaveBeenCalled();
    });

    it('reports a conflict when the other member blocked first', async () => {
      const { service, conversationModel } = build();
      conversationModel.blockConversation.mockResolvedValue(false);

      await expect(service.blockConversation(query)).rejects.toBeInstanceOf(ConflictException);
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
