import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { MessageStatus } from '@repo/enums';
import { Message } from '@repo/schemas';
import { ClientSession, Model } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageModel } from './message.model';

const MESSAGE_ID = '64b7f0c2a1b2c3d4e5f60718';
const CONVERSATION_ID = '64b7f0c2a1b2c3d4e5f60719';

function build() {
  const save = vi.fn().mockResolvedValue(undefined);

  // `createMessage` calls `new this.Message(data)`, so the mock must be constructible.
  const collection = Object.assign(
    vi.fn(function (this: Record<string, unknown>, data: object) {
      Object.assign(this, data, { save, toJSON: () => ({ ...data, id: MESSAGE_ID }) });
    }),
    {
      aggregate: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      updateOne: vi.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
    },
  );

  return { collection, save, model: new MessageModel(collection as unknown as Model<Message>) };
}

function storedMessage(status: MessageStatus) {
  return { status, toJSON: () => ({ id: MESSAGE_ID, status }) };
}

const session = {} as ClientSession;

describe('MessageModel', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('createMessage', () => {
    it('saves the message inside the session and returns it as JSON', async () => {
      const { collection, save, model } = build();

      await expect(model.createMessage({ text: 'hi' }, session)).resolves.toEqual({ text: 'hi', id: MESSAGE_ID });
      expect(collection).toHaveBeenCalledWith({ text: 'hi' });
      expect(save).toHaveBeenCalledWith({ session });
    });

    it('turns a failed save into a 500', async () => {
      const { save, model } = build();
      save.mockRejectedValue(new Error('connection lost'));

      await expect(model.createMessage({ text: 'hi' }, session)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('findMessagePayloadById', () => {
    it('returns the first aggregated message', async () => {
      const { collection, model } = build();
      const payload = { id: MESSAGE_ID };
      collection.aggregate.mockResolvedValue([payload]);

      await expect(model.findMessagePayloadById(MESSAGE_ID)).resolves.toBe(payload);
    });

    it('returns null when the message does not exist', async () => {
      const { model } = build();

      await expect(model.findMessagePayloadById(MESSAGE_ID)).resolves.toBeNull();
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.aggregate.mockRejectedValue(new Error('connection lost'));

      await expect(model.findMessagePayloadById(MESSAGE_ID)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('getMessagesByConversationId', () => {
    it('pages through the conversation newest first, then returns the page oldest first', async () => {
      const { collection, model } = build();

      await model.getMessagesByConversationId({ conversationId: CONVERSATION_ID, skip: 20, limit: 10 });

      const [pipeline] = collection.aggregate.mock.calls[0];
      expect(String(pipeline[0].$match.conversation)).toBe(CONVERSATION_ID);
      expect(pipeline.slice(1, 4)).toEqual([{ $sort: { dateCreated: -1 } }, { $skip: 20 }, { $limit: 10 }]);
      expect(pipeline.at(-1)).toEqual({ $sort: { dateCreated: 1 } });
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.aggregate.mockRejectedValue(new Error('connection lost'));

      await expect(
        model.getMessagesByConversationId({ conversationId: CONVERSATION_ID, skip: 0, limit: 10 }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('checkMessageAvailability', () => {
    it('returns a message that is not deleted as JSON', async () => {
      const { collection, model } = build();
      collection.findOne.mockResolvedValue(storedMessage(MessageStatus.UPDATED));

      await expect(model.checkMessageAvailability(MESSAGE_ID)).resolves.toEqual({
        id: MESSAGE_ID,
        status: MessageStatus.UPDATED,
      });
      expect(collection.findOne).toHaveBeenCalledWith({ _id: MESSAGE_ID });
    });

    it('rejects a missing message with 404', async () => {
      const { model } = build();

      await expect(model.checkMessageAvailability(MESSAGE_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a deleted message with 409', async () => {
      const { collection, model } = build();
      collection.findOne.mockResolvedValue(storedMessage(MessageStatus.DELETED));

      await expect(model.checkMessageAvailability(MESSAGE_ID)).rejects.toBeInstanceOf(ConflictException);
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.findOne.mockRejectedValue(new Error('connection lost'));

      await expect(model.checkMessageAvailability(MESSAGE_ID)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('updateMessage', () => {
    it('applies the update and returns the result', async () => {
      const { collection, model } = build();
      const update = { $addToSet: { seenBy: CONVERSATION_ID } };

      await expect(model.updateMessage(MESSAGE_ID, update)).resolves.toEqual({ matchedCount: 1, modifiedCount: 1 });
      expect(collection.updateOne).toHaveBeenCalledWith({ _id: MESSAGE_ID }, update);
    });

    it('treats a matched but unchanged message as success', async () => {
      const { collection, model } = build();
      collection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 0 });

      await expect(model.updateMessage(MESSAGE_ID, {})).resolves.toMatchObject({ modifiedCount: 0 });
    });

    it('rejects an update that matched nothing with 404', async () => {
      const { collection, model } = build();
      collection.updateOne.mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });

      await expect(model.updateMessage(MESSAGE_ID, {})).rejects.toBeInstanceOf(NotFoundException);
    });

    it('turns a driver failure into a 500', async () => {
      const { collection, model } = build();
      collection.updateOne.mockRejectedValue(new Error('connection lost'));

      await expect(model.updateMessage(MESSAGE_ID, {})).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
