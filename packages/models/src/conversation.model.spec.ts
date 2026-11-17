import { InternalServerErrorException } from '@nestjs/common';
import { ConversationStatus } from '@repo/enums';
import { Conversation } from '@repo/schemas';
import { ClientSession, Model, Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversationModel } from './conversation.model';

const CONVERSATION_ID = '64b7f0c2a1b2c3d4e5f60718';
const USER_ID = '64b7f0c2a1b2c3d4e5f60719';
const OTHER_ID = '64b7f0c2a1b2c3d4e5f6071a';
const THIRD_ID = '64b7f0c2a1b2c3d4e5f6071b';

function build() {
  const save = vi.fn().mockResolvedValue(undefined);
  const populate = vi.fn().mockResolvedValue(null);

  // `createConversation` calls `new this.Conversation(data)`, so the mock must be constructible.
  const collection = Object.assign(
    vi.fn(function (this: Record<string, unknown>, data: object) {
      Object.assign(this, data, { save });
    }),
    {
      exists: vi.fn().mockResolvedValue(null),
      findOne: vi.fn(() => Object.assign(Promise.resolve(null), { populate })),
      distinct: vi.fn().mockResolvedValue([]),
      aggregate: vi.fn().mockResolvedValue([]),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 0 }),
    },
  );

  return {
    collection,
    save,
    populate,
    model: new ConversationModel(collection as unknown as Model<Conversation>),
  };
}

const session = {} as ClientSession;

describe('ConversationModel', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('checkConversationExistByMembers', () => {
    it('matches a conversation with exactly those members, in any order', async () => {
      const { collection, model } = build();

      await model.checkConversationExistByMembers([USER_ID, OTHER_ID]);

      const [filter] = collection.exists.mock.calls[0];
      expect(filter.members.$size).toBe(2);
      expect(filter.members.$all.map(String)).toEqual([USER_ID, OTHER_ID]);
      expect(filter.members.$all[0]).toBeInstanceOf(Types.ObjectId);
    });

    it('is false when nothing matches and true when something does', async () => {
      const { collection, model } = build();

      await expect(model.checkConversationExistByMembers([USER_ID])).resolves.toBe(false);

      collection.exists.mockResolvedValue({ _id: CONVERSATION_ID });
      await expect(model.checkConversationExistByMembers([USER_ID])).resolves.toBe(true);
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.exists.mockRejectedValue(new Error('connection lost'));

      await expect(model.checkConversationExistByMembers([USER_ID])).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('createConversation', () => {
    it('saves the new conversation inside the session and returns it', async () => {
      const { collection, save, model } = build();

      const created = await model.createConversation({ name: 'team' }, session);

      expect(collection).toHaveBeenCalledWith({ name: 'team' });
      expect(save).toHaveBeenCalledWith({ session });
      expect(created).toMatchObject({ name: 'team' });
    });

    it('turns a failed save into a 500', async () => {
      const { save, model } = build();
      save.mockRejectedValue(new Error('duplicate key'));

      await expect(model.createConversation({}, session)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('isConversationMember', () => {
    it('looks the user up among the conversation members', async () => {
      const { collection, model } = build();

      await model.isConversationMember({ conversationId: CONVERSATION_ID, userId: USER_ID });

      const [filter] = collection.exists.mock.calls[0];
      expect(filter._id).toBe(CONVERSATION_ID);
      expect(filter.members.$in.map(String)).toEqual([USER_ID]);
    });

    it('reflects whether a match was found', async () => {
      const { collection, model } = build();
      const query = { conversationId: CONVERSATION_ID, userId: USER_ID };

      await expect(model.isConversationMember(query)).resolves.toBe(false);

      collection.exists.mockResolvedValue({ _id: CONVERSATION_ID });
      await expect(model.isConversationMember(query)).resolves.toBe(true);
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.exists.mockRejectedValue(new Error('connection lost'));

      await expect(
        model.isConversationMember({ conversationId: CONVERSATION_ID, userId: USER_ID }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('isUserBlockedInConversation', () => {
    it('only matches a blocked conversation the user did not block', async () => {
      const { collection, model } = build();

      await model.isUserBlockedInConversation({ conversationId: CONVERSATION_ID, userId: USER_ID });

      expect(collection.exists).toHaveBeenCalledWith({
        _id: CONVERSATION_ID,
        status: ConversationStatus.BLOCKED,
        blocker: { $ne: USER_ID },
      });
    });

    it('reflects whether a match was found', async () => {
      const { collection, model } = build();
      const query = { conversationId: CONVERSATION_ID, userId: USER_ID };

      await expect(model.isUserBlockedInConversation(query)).resolves.toBe(false);

      collection.exists.mockResolvedValue({ _id: CONVERSATION_ID });
      await expect(model.isUserBlockedInConversation(query)).resolves.toBe(true);
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.exists.mockRejectedValue(new Error('connection lost'));

      await expect(
        model.isUserBlockedInConversation({ conversationId: CONVERSATION_ID, userId: USER_ID }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('isConversationBlocked', () => {
    it('matches any blocked conversation, whoever blocked it', async () => {
      const { collection, model } = build();

      await model.isConversationBlocked(CONVERSATION_ID);

      expect(collection.exists).toHaveBeenCalledWith({ _id: CONVERSATION_ID, status: ConversationStatus.BLOCKED });
    });

    it('reflects whether a match was found', async () => {
      const { collection, model } = build();

      await expect(model.isConversationBlocked(CONVERSATION_ID)).resolves.toBe(false);

      collection.exists.mockResolvedValue({ _id: CONVERSATION_ID });
      await expect(model.isConversationBlocked(CONVERSATION_ID)).resolves.toBe(true);
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.exists.mockRejectedValue(new Error('connection lost'));

      await expect(model.isConversationBlocked(CONVERSATION_ID)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('blockConversation', () => {
    it('only blocks a live one-to-one conversation the user is in, and records the blocker', async () => {
      const { collection, model } = build();

      await model.blockConversation({ conversationId: CONVERSATION_ID, userId: USER_ID });

      const [filter, update] = collection.updateOne.mock.calls[0];
      expect(filter._id).toBe(CONVERSATION_ID);
      expect(filter.members.$size).toBe(2);
      expect(filter.members.$all.map(String)).toEqual([USER_ID]);
      expect(filter.status).toEqual({ $nin: [ConversationStatus.BLOCKED, ConversationStatus.DELETED] });
      expect(update.$set.status).toBe(ConversationStatus.BLOCKED);
      expect(String(update.$set.blocker)).toBe(USER_ID);
      expect(update.$set.blocker).toBeInstanceOf(Types.ObjectId);
    });

    it('reports whether the conversation changed', async () => {
      const { collection, model } = build();
      const query = { conversationId: CONVERSATION_ID, userId: USER_ID };

      await expect(model.blockConversation(query)).resolves.toBe(false);

      collection.updateOne.mockResolvedValue({ modifiedCount: 1 });
      await expect(model.blockConversation(query)).resolves.toBe(true);
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.updateOne.mockRejectedValue(new Error('connection lost'));

      await expect(
        model.blockConversation({ conversationId: CONVERSATION_ID, userId: USER_ID }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('unblockConversation', () => {
    it('only lifts a block placed by the user, clearing status and blocker', async () => {
      const { collection, model } = build();

      await model.unblockConversation({ conversationId: CONVERSATION_ID, userId: USER_ID });

      const [filter, update] = collection.updateOne.mock.calls[0];
      expect(filter._id).toBe(CONVERSATION_ID);
      expect(filter.status).toBe(ConversationStatus.BLOCKED);
      expect(String(filter.blocker)).toBe(USER_ID);
      expect(update).toEqual({ $unset: { status: 1, blocker: 1 } });
    });

    it('reports whether the conversation changed', async () => {
      const { collection, model } = build();
      const query = { conversationId: CONVERSATION_ID, userId: USER_ID };

      await expect(model.unblockConversation(query)).resolves.toBe(false);

      collection.updateOne.mockResolvedValue({ modifiedCount: 1 });
      await expect(model.unblockConversation(query)).resolves.toBe(true);
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.updateOne.mockRejectedValue(new Error('connection lost'));

      await expect(
        model.unblockConversation({ conversationId: CONVERSATION_ID, userId: USER_ID }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('setNickname', () => {
    it("sets the value on the member's own nickname entry, inside the given session", async () => {
      const { collection, model } = build();

      await model.setNickname({ conversationId: CONVERSATION_ID, userId: OTHER_ID, value: 'Ace' }, session);

      const [filter, update, options] = collection.updateOne.mock.calls[0];
      expect(filter._id).toBe(CONVERSATION_ID);
      expect(String(filter.members)).toBe(OTHER_ID);
      expect(filter.members).toBeInstanceOf(Types.ObjectId);
      expect(String(filter['nicknames.user'])).toBe(OTHER_ID);
      expect(update).toEqual({ $set: { 'nicknames.$.value': 'Ace' } });
      expect(options).toEqual({ session });
    });

    it('reports whether the member was found and whether the nickname changed', async () => {
      const { collection, model } = build();
      const query = { conversationId: CONVERSATION_ID, userId: OTHER_ID, value: 'Ace' };

      collection.updateOne.mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });
      await expect(model.setNickname(query)).resolves.toEqual({ found: false, changed: false });

      collection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 0 });
      await expect(model.setNickname(query)).resolves.toEqual({ found: true, changed: false });

      collection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
      await expect(model.setNickname(query)).resolves.toEqual({ found: true, changed: true });
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.updateOne.mockRejectedValue(new Error('connection lost'));

      await expect(
        model.setNickname({ conversationId: CONVERSATION_ID, userId: OTHER_ID, value: 'Ace' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('getCallMembersByConversationId', () => {
    it('returns the members of the matched conversation', async () => {
      const { collection, model } = build();
      const members = [{ id: USER_ID, displayName: 'a', photoUrl: null }];
      collection.aggregate.mockResolvedValue([{ members }]);

      await expect(model.getCallMembersByConversationId(CONVERSATION_ID)).resolves.toBe(members);

      const [pipeline] = collection.aggregate.mock.calls[0];
      expect(String(pipeline[0].$match._id)).toBe(CONVERSATION_ID);
    });

    it('returns null when the conversation does not exist', async () => {
      const { model } = build();

      await expect(model.getCallMembersByConversationId(CONVERSATION_ID)).resolves.toBeNull();
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.aggregate.mockRejectedValue(new Error('connection lost'));

      await expect(model.getCallMembersByConversationId(CONVERSATION_ID)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('getConversationPartnerIds', () => {
    it('returns everyone the user shares a conversation with, as strings, excluding the user', async () => {
      const { collection, model } = build();
      collection.distinct.mockResolvedValue([
        new Types.ObjectId(USER_ID),
        new Types.ObjectId(OTHER_ID),
        new Types.ObjectId(THIRD_ID),
      ]);

      await expect(model.getConversationPartnerIds(USER_ID)).resolves.toEqual([OTHER_ID, THIRD_ID]);

      const [field, filter] = collection.distinct.mock.calls[0];
      expect(field).toBe('members');
      expect(String(filter.members)).toBe(USER_ID);
    });

    it('is empty for a user with no conversations', async () => {
      const { model } = build();

      await expect(model.getConversationPartnerIds(USER_ID)).resolves.toEqual([]);
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.distinct.mockRejectedValue(new Error('connection lost'));

      await expect(model.getConversationPartnerIds(USER_ID)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findConversationByMembers', () => {
    it('matches conversations with exactly those members and populates them', async () => {
      const { collection, model } = build();
      const found = [{ _id: CONVERSATION_ID, members: [] }];
      collection.aggregate.mockResolvedValue(found);

      await expect(model.findConversationByMembers([USER_ID, OTHER_ID], USER_ID)).resolves.toBe(found);

      const [pipeline] = collection.aggregate.mock.calls[0];
      const { members } = pipeline[0].$match;
      expect(members.$size).toBe(2);
      expect(members.$all.map(String)).toEqual([USER_ID, OTHER_ID]);
      expect(members.$all[0]).toBeInstanceOf(Types.ObjectId);
      expect(pipeline[1].$lookup).toMatchObject({ from: 'user', localField: 'members', as: 'members' });
      expect(String(pipeline[1].$lookup.pipeline[0].$match._id.$ne)).toBe(USER_ID);
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.aggregate.mockRejectedValue(new Error('connection lost'));

      await expect(model.findConversationByMembers([USER_ID], USER_ID)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findConversationPayloadById', () => {
    it('populates members, admins and photo', async () => {
      const { collection, populate, model } = build();

      await model.findConversationPayloadById(CONVERSATION_ID);

      expect(collection.findOne).toHaveBeenCalledWith({ _id: CONVERSATION_ID });
      const paths = populate.mock.calls[0][0].map(({ path }: { path: string }) => path);
      expect(paths).toEqual(['members', 'admins', 'photo']);
    });

    it('turns a driver failure into a 500', async () => {
      const { populate, model } = build();
      populate.mockRejectedValue(new Error('connection lost'));

      await expect(model.findConversationPayloadById(CONVERSATION_ID)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('aggregate queries', () => {
    it('scopes the conversation list to the user', async () => {
      const { collection, model } = build();

      await model.getConversationsByUserId(USER_ID);

      const [pipeline] = collection.aggregate.mock.calls[0];
      expect(JSON.stringify(pipeline[0])).toContain(USER_ID);
    });

    it('leaves blocked conversations out of the active list', async () => {
      const { collection, model } = build();

      await model.getActiveConversationByUserId(USER_ID);

      const [pipeline] = collection.aggregate.mock.calls[0];
      expect(pipeline[0].$match.members.$in.map(String)).toEqual([USER_ID]);
      expect(pipeline[0].$match.status).toEqual({ $ne: ConversationStatus.BLOCKED });
      expect(pipeline.find((stage: { $project?: object }) => stage.$project)?.$project).toHaveProperty('nicknames', 1);
    });

    it('lists only the conversations the user blocked, with the other member as blockedUser', async () => {
      const { collection, model } = build();

      await model.getBlockedConversationsByUserId(USER_ID);

      const [pipeline] = collection.aggregate.mock.calls[0];
      expect(pipeline[0].$match.status).toBe(ConversationStatus.BLOCKED);
      expect(String(pipeline[0].$match.blocker)).toBe(USER_ID);
      expect(String(pipeline[1].$lookup.pipeline[0].$match._id.$ne)).toBe(USER_ID);
      expect(pipeline).toContainEqual({ $set: { blockedUser: { $first: '$members' } } });
      expect(pipeline.find((stage: { $project?: object }) => stage.$project)?.$project).toEqual({
        blockedUser: 1,
        blocker: 1,
        lastUpdated: 1,
      });
    });

    it.each(['getConversationsByUserId', 'getActiveConversationByUserId', 'getBlockedConversationsByUserId'] as const)(
      '%s turns a driver failure into a 500',
      async (method) => {
        const { collection, model } = build();
        collection.aggregate.mockRejectedValue(new Error('connection lost'));

        await expect(model[method](USER_ID)).rejects.toBeInstanceOf(InternalServerErrorException);
      },
    );
  });
});
