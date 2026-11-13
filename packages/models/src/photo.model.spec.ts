import { InternalServerErrorException } from '@nestjs/common';
import { Message, Photo } from '@repo/schemas';
import { ClientSession, Model } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PhotoModel } from './photo.model';
import { toEntity } from './pipeline';

const CONVERSATION_ID = '64b7f0c2a1b2c3d4e5f60718';

function build() {
  const photos = { create: vi.fn() };
  const messages = { aggregate: vi.fn().mockResolvedValue([]) };
  return {
    photos,
    messages,
    model: new PhotoModel(photos as unknown as Model<Photo>, messages as unknown as Model<Message>),
  };
}

const session = {} as ClientSession;

describe('toEntity', () => {
  it('swaps _id for a string id and drops __v', () => {
    expect(toEntity).toEqual([{ $set: { id: { $toString: '$_id' } } }, { $unset: ['_id', '__v'] }]);
  });
});

describe('PhotoModel', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('createMany', () => {
    it('creates the photos in order inside the session and returns them as JSON', async () => {
      const { photos, model } = build();
      photos.create.mockResolvedValue([{ toJSON: () => ({ url: 'a' }) }, { toJSON: () => ({ url: 'b' }) }]);

      await expect(model.createMany([{ url: 'a' }, { url: 'b' }], session)).resolves.toEqual([{ url: 'a' }, { url: 'b' }]);
      expect(photos.create).toHaveBeenCalledWith([{ url: 'a' }, { url: 'b' }], { session, ordered: true });
    });

    it('turns a driver failure into a 500', async () => {
      const { photos, model } = build();
      photos.create.mockRejectedValue(new Error('connection lost'));

      await expect(model.createMany([{ url: 'a' }], session)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('getPhotosByConversationId', () => {
    it("finds the conversation's messages that carry photos, newest first", async () => {
      const { messages, model } = build();
      const found = [{ id: 'm1', photos: [{ id: 'p1' }] }];
      messages.aggregate.mockResolvedValue(found);

      await expect(model.getPhotosByConversationId(CONVERSATION_ID)).resolves.toBe(found);

      const [pipeline] = messages.aggregate.mock.calls[0];
      expect(String(pipeline[0].$match.conversation)).toBe(CONVERSATION_ID);
      expect(pipeline[0].$match['photos.0']).toEqual({ $exists: true });
      expect(pipeline[1]).toEqual({ $sort: { dateCreated: -1 } });
      expect(pipeline.slice(-2)).toEqual(toEntity);
    });

    it('only exposes public sender fields', async () => {
      const { messages, model } = build();

      await model.getPhotosByConversationId(CONVERSATION_ID);

      const [pipeline] = messages.aggregate.mock.calls[0];
      const senderLookup = pipeline.find((stage: { $lookup?: { as: string } }) => stage.$lookup?.as === 'sender');
      const projection = senderLookup.$lookup.pipeline.find((stage: { $project?: object }) => stage.$project).$project;
      expect(projection).toEqual({ userName: 1, displayName: 1, status: 1, photo: 1 });
    });

    it('turns a driver failure into a 500', async () => {
      const { messages, model } = build();
      messages.aggregate.mockRejectedValue(new Error('connection lost'));

      await expect(model.getPhotosByConversationId(CONVERSATION_ID)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
