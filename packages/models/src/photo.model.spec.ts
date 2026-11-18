import { InternalServerErrorException } from '@nestjs/common';
import { PhotoType } from '@repo/enums';
import { Message, Photo } from '@repo/schemas';
import { ClientSession, Model } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PhotoModel } from './photo.model';
import { toEntity } from './pipeline';

const CONVERSATION_ID = '64b7f0c2a1b2c3d4e5f60718';
const OWNER_ID = '64b7f0c2a1b2c3d4e5f60719';

function chain(result: unknown) {
  const query = {
    sort: vi.fn(() => query),
    skip: vi.fn(() => query),
    select: vi.fn(() => query),
    session: vi.fn(() => query),
    lean: vi.fn().mockResolvedValue(result),
  };
  return query;
}

function build() {
  const photos = {
    create: vi.fn(),
    deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    deleteMany: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    updateOne: vi.fn().mockResolvedValue({ acknowledged: true, matchedCount: 1 }),
    find: vi.fn(() => chain([])),
    findOne: vi.fn(() => chain(null)),
  };
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

  describe('deleteById', () => {
    it('deletes the photo inside the session', async () => {
      const { photos, model } = build();

      await model.deleteById('p1', session);

      expect(photos.deleteOne).toHaveBeenCalledWith({ _id: 'p1' }, { session });
    });

    it('turns a driver failure into a 500', async () => {
      const { photos, model } = build();
      photos.deleteOne.mockRejectedValue(new Error('connection lost'));

      await expect(model.deleteById('p1')).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('getProfilePhotosByOwnerId', () => {
    it('lists the owner profile photos, most recently used first', async () => {
      const { photos, model } = build();
      const query = chain([{ url: 'a' }]);
      photos.find.mockReturnValue(query);

      await expect(model.getProfilePhotosByOwnerId(OWNER_ID)).resolves.toEqual([{ url: 'a' }]);
      expect(photos.find).toHaveBeenCalledWith({ owner: OWNER_ID, type: PhotoType.PROFILE });
      expect(query.sort).toHaveBeenCalledWith({ lastUpdated: -1 });
    });

    it('turns a driver failure into a 500', async () => {
      const { photos, model } = build();
      photos.find.mockImplementation(() => {
        throw new Error('connection lost');
      });

      await expect(model.getProfilePhotosByOwnerId(OWNER_ID)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findProfilePhoto', () => {
    it('only finds a profile photo that belongs to the owner', async () => {
      const { photos, model } = build();
      photos.findOne.mockReturnValue(chain({ url: 'a' }));

      await expect(model.findProfilePhoto({ photoId: 'p1', ownerId: OWNER_ID })).resolves.toEqual({ url: 'a' });
      expect(photos.findOne).toHaveBeenCalledWith({ _id: 'p1', owner: OWNER_ID, type: PhotoType.PROFILE });
    });

    it('is null when the owner has no such photo', async () => {
      const { model } = build();

      await expect(model.findProfilePhoto({ photoId: 'p1', ownerId: OWNER_ID })).resolves.toBeNull();
    });
  });

  describe('markAsRecent', () => {
    it('stamps the photo as just used inside the session', async () => {
      const { photos, model } = build();

      await expect(model.markAsRecent('p1', session)).resolves.toBe(true);

      const [filter, update, options] = photos.updateOne.mock.calls[0];
      expect(filter).toEqual({ _id: 'p1' });
      expect(update.$set.lastUpdated).toBeInstanceOf(Date);
      expect(options).toEqual({ session });
    });

    it('is false when the photo no longer exists', async () => {
      const { photos, model } = build();
      photos.updateOne.mockResolvedValue({ acknowledged: true, matchedCount: 0 });

      await expect(model.markAsRecent('p1', session)).resolves.toBe(false);
    });
  });

  describe('deleteProfilePhoto', () => {
    it('only deletes a profile photo the owner has, inside the session', async () => {
      const { photos, model } = build();

      await expect(model.deleteProfilePhoto({ photoId: 'p1', ownerId: OWNER_ID }, session)).resolves.toBe(true);
      expect(photos.deleteOne).toHaveBeenCalledWith(
        { _id: 'p1', owner: OWNER_ID, type: PhotoType.PROFILE },
        { session },
      );
    });

    it('is false when the owner has no such photo', async () => {
      const { photos, model } = build();
      photos.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(model.deleteProfilePhoto({ photoId: 'p1', ownerId: OWNER_ID })).resolves.toBe(false);
    });
  });

  describe('deleteProfilePhotosBeyond', () => {
    it('deletes every profile photo past the newest ones it keeps', async () => {
      const { photos, model } = build();
      const query = chain([{ _id: 'old-1' }, { _id: 'old-2' }]);
      photos.find.mockReturnValue(query);

      await model.deleteProfilePhotosBeyond({ ownerId: OWNER_ID, keep: 5 }, session);

      expect(photos.find).toHaveBeenCalledWith({ owner: OWNER_ID, type: PhotoType.PROFILE });
      expect(query.sort).toHaveBeenCalledWith({ lastUpdated: -1 });
      expect(query.skip).toHaveBeenCalledWith(5);
      expect(query.session).toHaveBeenCalledWith(session);
      expect(photos.deleteMany).toHaveBeenCalledWith({ _id: { $in: ['old-1', 'old-2'] } }, { session });
    });

    it('deletes nothing when the owner is within the limit', async () => {
      const { photos, model } = build();

      await model.deleteProfilePhotosBeyond({ ownerId: OWNER_ID, keep: 5 });

      expect(photos.deleteMany).not.toHaveBeenCalled();
    });

    it('turns a driver failure into a 500', async () => {
      const { photos, model } = build();
      photos.find.mockImplementation(() => {
        throw new Error('connection lost');
      });

      await expect(model.deleteProfilePhotosBeyond({ ownerId: OWNER_ID, keep: 5 })).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteProfilePhotosByOwnerId', () => {
    it('deletes only the owner profile photos inside the session', async () => {
      const { photos, model } = build();

      await model.deleteProfilePhotosByOwnerId(OWNER_ID, session);

      expect(photos.deleteMany).toHaveBeenCalledWith({ owner: OWNER_ID, type: PhotoType.PROFILE }, { session });
    });

    it('turns a driver failure into a 500', async () => {
      const { photos, model } = build();
      photos.deleteMany.mockRejectedValue(new Error('connection lost'));

      await expect(model.deleteProfilePhotosByOwnerId(OWNER_ID)).rejects.toBeInstanceOf(InternalServerErrorException);
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
