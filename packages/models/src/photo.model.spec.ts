import { InternalServerErrorException } from '@nestjs/common';
import { PhotoType } from '@repo/enums';
import { Message, Photo } from '@repo/schemas';
import { ClientSession, Model } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PhotoModel } from './photo.model';
import { toEntity } from './pipeline';

const CONVERSATION_ID = '64b7f0c2a1b2c3d4e5f60718';
const OWNER_ID = '64b7f0c2a1b2c3d4e5f60719';
const PHOTO_ID = '64b7f0c2a1b2c3d4e5f60720';

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
    findOneAndDelete: vi.fn(() => chain({ _id: 'p1', key: 'p1-key' })),
    findOneAndUpdate: vi.fn(() => chain({ _id: PHOTO_ID, url: 'https://utfs.io/f/k' })),
    bulkWrite: vi.fn().mockResolvedValue({ matchedCount: 1 }),
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
    it('deletes the photo inside the session and returns its file key', async () => {
      const { photos, model } = build();

      await expect(model.deleteById('p1', session)).resolves.toBe('p1-key');
      expect(photos.findOneAndDelete).toHaveBeenCalledWith({ _id: 'p1' }, { session, projection: { key: 1 } });
    });

    it('is null when the photo is already gone', async () => {
      const { photos, model } = build();
      photos.findOneAndDelete.mockReturnValue(chain(null));

      await expect(model.deleteById('p1')).resolves.toBeNull();
    });

    it('turns a driver failure into a 500', async () => {
      const { photos, model } = build();
      photos.findOneAndDelete.mockImplementation(() => {
        throw new Error('connection lost');
      });

      await expect(model.deleteById('p1')).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('createPending', () => {
    it('saves an uploaded file as a pending photo of its owner', async () => {
      const { photos, model } = build();
      photos.create.mockResolvedValue({ _id: PHOTO_ID, url: 'https://utfs.io/f/k' });

      await expect(
        model.createPending({ ownerId: OWNER_ID, type: PhotoType.MESSAGE, key: 'k', url: 'https://utfs.io/f/k' }),
      ).resolves.toEqual({ id: PHOTO_ID, url: 'https://utfs.io/f/k' });

      const [created] = photos.create.mock.calls[0] as [Record<string, unknown>];
      expect(String(created.owner)).toBe(OWNER_ID);
      expect(created).toMatchObject({ type: PhotoType.MESSAGE, key: 'k', url: 'https://utfs.io/f/k', pending: true });
    });

    it('turns a driver failure into a 500', async () => {
      const { photos, model } = build();
      photos.create.mockRejectedValue(new Error('connection lost'));

      await expect(
        model.createPending({ ownerId: OWNER_ID, type: PhotoType.MESSAGE, key: 'k', url: 'https://utfs.io/f/k' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('claimPendingPhotos', () => {
    const photo = { id: PHOTO_ID, width: 640, height: 480 };

    it('claims only pending photos of the owner and type, saving their size', async () => {
      const { photos, model } = build();

      await expect(
        model.claimPendingPhotos({ ownerId: OWNER_ID, type: PhotoType.MESSAGE, photos: [photo] }, session),
      ).resolves.toBe(true);

      const [[operation], options] = photos.bulkWrite.mock.calls[0] as [
        { updateOne: { filter: Record<string, unknown>; update: unknown } }[],
        unknown,
      ];
      expect(options).toEqual({ session });
      expect(String(operation.updateOne.filter._id)).toBe(PHOTO_ID);
      expect(String(operation.updateOne.filter.owner)).toBe(OWNER_ID);
      expect(operation.updateOne.filter).toMatchObject({ type: PhotoType.MESSAGE, pending: true });
      expect(operation.updateOne.update).toEqual({ $set: { pending: false, width: 640, height: 480 } });
    });

    it('is false when any photo is not a pending photo of the owner', async () => {
      const { photos, model } = build();
      photos.bulkWrite.mockResolvedValue({ matchedCount: 1 });

      await expect(
        model.claimPendingPhotos(
          { ownerId: OWNER_ID, type: PhotoType.MESSAGE, photos: [photo, { ...photo, id: OWNER_ID }] },
          session,
        ),
      ).resolves.toBe(false);
    });

    it('claims nothing when there are no photos', async () => {
      const { photos, model } = build();

      await expect(
        model.claimPendingPhotos({ ownerId: OWNER_ID, type: PhotoType.MESSAGE, photos: [] }, session),
      ).resolves.toBe(true);
      expect(photos.bulkWrite).not.toHaveBeenCalled();
    });
  });

  describe('claimPendingPhoto', () => {
    it('claims a pending photo of the owner and type inside the session', async () => {
      const { photos, model } = build();

      await expect(
        model.claimPendingPhoto({ photoId: PHOTO_ID, ownerId: OWNER_ID, type: PhotoType.CONVERSATION }, session),
      ).resolves.toEqual({ _id: PHOTO_ID, url: 'https://utfs.io/f/k' });
      expect(photos.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: PHOTO_ID, owner: OWNER_ID, type: PhotoType.CONVERSATION, pending: true },
        { $set: { pending: false } },
        { session, new: true, projection: { url: 1 } },
      );
    });
  });

  describe('deletePendingPhoto', () => {
    it('deletes only a pending photo of the owner and returns its file key', async () => {
      const { photos, model } = build();

      await expect(model.deletePendingPhoto({ photoId: PHOTO_ID, ownerId: OWNER_ID })).resolves.toBe('p1-key');
      expect(photos.findOneAndDelete).toHaveBeenCalledWith(
        { _id: PHOTO_ID, owner: OWNER_ID, pending: true },
        { projection: { key: 1 } },
      );
    });

    it('is null when there is no such pending photo', async () => {
      const { photos, model } = build();
      photos.findOneAndDelete.mockReturnValue(chain(null));

      await expect(model.deletePendingPhoto({ photoId: PHOTO_ID, ownerId: OWNER_ID })).resolves.toBeNull();
    });
  });

  describe('deletePendingPhotosOlderThan', () => {
    it('deletes each stale photo that is still pending and returns their file keys', async () => {
      const { photos, model } = build();
      const cutoff = new Date('2026-11-17T12:00:00Z');
      photos.find.mockReturnValue(chain([{ _id: 'stale-1' }, { _id: 'stale-2' }]));
      photos.findOneAndDelete
        .mockReturnValueOnce(chain({ _id: 'stale-1', key: 'stale-1-key' }))
        .mockReturnValueOnce(chain(null));

      await expect(model.deletePendingPhotosOlderThan(cutoff)).resolves.toEqual(['stale-1-key']);
      expect(photos.find).toHaveBeenCalledWith({ pending: true, dateCreated: { $lt: cutoff } });
      expect(photos.findOneAndDelete).toHaveBeenCalledWith(
        { _id: 'stale-2', pending: true },
        { projection: { key: 1 } },
      );
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
    it('only deletes a profile photo the owner has, inside the session, and returns its file key', async () => {
      const { photos, model } = build();

      await expect(model.deleteProfilePhoto({ photoId: 'p1', ownerId: OWNER_ID }, session)).resolves.toBe('p1-key');
      expect(photos.findOneAndDelete).toHaveBeenCalledWith(
        { _id: 'p1', owner: OWNER_ID, type: PhotoType.PROFILE },
        { session, projection: { key: 1 } },
      );
    });

    it('is null when the owner has no such photo', async () => {
      const { photos, model } = build();
      photos.findOneAndDelete.mockReturnValue(chain(null));

      await expect(model.deleteProfilePhoto({ photoId: 'p1', ownerId: OWNER_ID })).resolves.toBeNull();
    });
  });

  describe('deleteProfilePhotosBeyond', () => {
    it('deletes every profile photo past the newest ones it keeps', async () => {
      const { photos, model } = build();
      const query = chain([
        { _id: 'old-1', key: 'old-1-key' },
        { _id: 'old-2', key: 'old-2-key' },
      ]);
      photos.find.mockReturnValue(query);

      const deletedKeys = await model.deleteProfilePhotosBeyond({ ownerId: OWNER_ID, keep: 5 }, session);

      expect(deletedKeys).toEqual(['old-1-key', 'old-2-key']);
      expect(query.select).toHaveBeenCalledWith('_id key');

      expect(photos.find).toHaveBeenCalledWith({ owner: OWNER_ID, type: PhotoType.PROFILE });
      expect(query.sort).toHaveBeenCalledWith({ lastUpdated: -1 });
      expect(query.skip).toHaveBeenCalledWith(5);
      expect(query.session).toHaveBeenCalledWith(session);
      expect(photos.deleteMany).toHaveBeenCalledWith({ _id: { $in: ['old-1', 'old-2'] } }, { session });
    });

    it('deletes nothing when the owner is within the limit', async () => {
      const { photos, model } = build();

      const deletedKeys = await model.deleteProfilePhotosBeyond({ ownerId: OWNER_ID, keep: 5 });

      expect(deletedKeys).toEqual([]);
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
    it('deletes only the owner profile photos inside the session and returns their file keys', async () => {
      const { photos, model } = build();
      const query = chain([{ _id: 'p1', key: 'p1-key' }, { _id: 'p2', key: 'p2-key' }]);
      photos.find.mockReturnValue(query);

      const deletedKeys = await model.deleteProfilePhotosByOwnerId(OWNER_ID, session);

      expect(deletedKeys).toEqual(['p1-key', 'p2-key']);
      expect(photos.find).toHaveBeenCalledWith({ owner: OWNER_ID, type: PhotoType.PROFILE });
      expect(query.session).toHaveBeenCalledWith(session);
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
