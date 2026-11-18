import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CONVERSATION_PHOTO_UPLOAD_ENDPOINT,
  MESSAGE_PHOTOS_UPLOAD_ENDPOINT,
  PENDING_PHOTO_MAX_AGE_IN_SECONDS,
  PROFILE_PHOTO_UPLOAD_ENDPOINT,
} from '@repo/constants';
import { PhotoType } from '@repo/enums';
import { PhotoModel } from '@repo/models';
import { UploadThingError } from 'uploadthing/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadedFilesService } from '../../common/uploaded-files/uploaded-files.service';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { UploadService } from './upload.service';

vi.mock('uploadthing/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uploadthing/server')>()),
  createRouteHandler: vi.fn(() => routeHandler),
}));

const routeHandler = vi.fn().mockResolvedValue(new Response(null));
const UPLOADER_ID = '507f1f77bcf86cd799439011';
const PHOTO_ID = '507f1f77bcf86cd799439022';
const ENV: Record<string, string> = {
  SERVER_URL: 'http://localhost:4000/',
  UPLOADTHING_TOKEN: 'token',
};

function build() {
  const authService = {
    resolveSession: vi.fn().mockResolvedValue({ id: UPLOADER_ID }),
  };
  const userService = {
    uploadProfilePhoto: vi.fn().mockResolvedValue({
      photo: { id: 'photo-1', url: 'https://utfs.io/f/k' },
    }),
  };
  const photoModel = {
    createPending: vi
      .fn()
      .mockResolvedValue({ id: PHOTO_ID, url: 'https://utfs.io/f/file-key' }),
    deletePendingPhoto: vi.fn().mockResolvedValue('pending-key'),
    deletePendingPhotosOlderThan: vi.fn().mockResolvedValue(['stale-key']),
  };
  const uploadedFiles = { deleteFiles: vi.fn().mockResolvedValue(undefined) };
  const configService = { get: vi.fn((key: string) => ENV[key]) };

  const service = new UploadService(
    authService as unknown as AuthService,
    userService as unknown as UserService,
    photoModel as unknown as PhotoModel,
    uploadedFiles as unknown as UploadedFilesService,
    configService as unknown as ConfigService,
  );

  return {
    service,
    authService,
    userService,
    photoModel,
    uploadedFiles,
  };
}

const uploadRequest = () => new Request('http://localhost:4000/v1/upload');

const uploadedFile = {
  key: 'file-key',
  ufsUrl: 'https://utfs.io/f/file-key',
  url: 'https://utfs.io/f/file-key',
  name: 'me.png',
  size: 10,
};

async function completeUpload(
  mocks: ReturnType<typeof build>,
  endpoint: string,
) {
  const result: unknown = await mocks.service.router[endpoint].onUploadComplete(
    {
      req: uploadRequest(),
      metadata: { uploaderId: UPLOADER_ID },
      file: uploadedFile,
    },
  );
  return result;
}

describe('UploadService', () => {
  let mocks: ReturnType<typeof build>;

  beforeEach(() => {
    mocks = build();
  });

  it('hands requests to the UploadThing route handler', async () => {
    const request = uploadRequest();

    await mocks.service.handle(request, 'valid');

    expect(routeHandler).toHaveBeenCalledWith(request);
  });

  describe.each([
    PROFILE_PHOTO_UPLOAD_ENDPOINT,
    MESSAGE_PHOTOS_UPLOAD_ENDPOINT,
    CONVERSATION_PHOTO_UPLOAD_ENDPOINT,
  ])('%s middleware', (endpoint) => {
    const runMiddleware = (request: Request) =>
      mocks.service.router[endpoint].middleware({ req: request, files: [] });

    it('refuses an upload without a session cookie', async () => {
      const request = uploadRequest();
      await mocks.service.handle(request);

      await expect(runMiddleware(request)).rejects.toBeInstanceOf(
        UploadThingError,
      );
      expect(mocks.authService.resolveSession).not.toHaveBeenCalled();
    });

    it('refuses an upload with an expired session', async () => {
      mocks.authService.resolveSession.mockResolvedValue(null);
      const request = uploadRequest();
      await mocks.service.handle(request, 'stale');

      await expect(runMiddleware(request)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
      expect(mocks.authService.resolveSession).toHaveBeenCalledWith('stale');
    });

    it('tags the upload with the logged-in uploader', async () => {
      const request = uploadRequest();
      await mocks.service.handle(request, 'valid');

      await expect(runMiddleware(request)).resolves.toEqual({
        uploaderId: UPLOADER_ID,
      });
    });
  });

  describe('profile photo upload complete', () => {
    it('saves the uploaded file as the uploader profile photo', async () => {
      await expect(
        completeUpload(mocks, PROFILE_PHOTO_UPLOAD_ENDPOINT),
      ).resolves.toEqual({
        photo: { id: 'photo-1', url: 'https://utfs.io/f/k' },
      });
      expect(mocks.userService.uploadProfilePhoto).toHaveBeenCalledWith({
        requesterId: UPLOADER_ID,
        photo: { key: 'file-key', url: 'https://utfs.io/f/file-key' },
      });
      expect(mocks.uploadedFiles.deleteFiles).not.toHaveBeenCalled();
    });

    it('deletes the uploaded file when it cannot be saved', async () => {
      mocks.userService.uploadProfilePhoto.mockRejectedValue(
        new Error('write conflict'),
      );

      await expect(
        completeUpload(mocks, PROFILE_PHOTO_UPLOAD_ENDPOINT),
      ).rejects.toThrow('write conflict');
      expect(mocks.uploadedFiles.deleteFiles).toHaveBeenCalledWith([
        'file-key',
      ]);
    });
  });

  describe.each([
    [MESSAGE_PHOTOS_UPLOAD_ENDPOINT, PhotoType.MESSAGE],
    [CONVERSATION_PHOTO_UPLOAD_ENDPOINT, PhotoType.CONVERSATION],
  ])('%s upload complete', (endpoint, type) => {
    it('saves the file as a pending photo of the uploader', async () => {
      await expect(completeUpload(mocks, endpoint)).resolves.toEqual({
        photo: { id: PHOTO_ID, url: 'https://utfs.io/f/file-key' },
      });
      expect(mocks.photoModel.createPending).toHaveBeenCalledWith({
        ownerId: UPLOADER_ID,
        type,
        key: 'file-key',
        url: 'https://utfs.io/f/file-key',
      });
    });

    it('deletes the uploaded file when it cannot be saved', async () => {
      mocks.photoModel.createPending.mockRejectedValue(new Error('db down'));

      await expect(completeUpload(mocks, endpoint)).rejects.toThrow('db down');
      expect(mocks.uploadedFiles.deleteFiles).toHaveBeenCalledWith([
        'file-key',
      ]);
    });
  });

  describe('deletePendingPhoto', () => {
    it('deletes a pending photo of the requester and its file', async () => {
      await mocks.service.deletePendingPhoto({
        requesterId: UPLOADER_ID,
        photoId: PHOTO_ID,
      });

      expect(mocks.photoModel.deletePendingPhoto).toHaveBeenCalledWith({
        photoId: PHOTO_ID,
        ownerId: UPLOADER_ID,
      });
      expect(mocks.uploadedFiles.deleteFiles).toHaveBeenCalledWith([
        'pending-key',
      ]);
    });

    it('refuses a photo that is not a pending upload of the requester', async () => {
      mocks.photoModel.deletePendingPhoto.mockResolvedValue(null);

      await expect(
        mocks.service.deletePendingPhoto({
          requesterId: UPLOADER_ID,
          photoId: PHOTO_ID,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mocks.uploadedFiles.deleteFiles).not.toHaveBeenCalled();
    });
  });

  describe('stale pending photos', () => {
    afterEach(() => {
      mocks.service.onModuleDestroy();
      vi.useRealTimers();
    });

    it('deletes pending photos older than the max age and their files', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-18T12:00:00Z'));

      await mocks.service.deleteStalePendingPhotos();

      const [cutoff] = mocks.photoModel.deletePendingPhotosOlderThan.mock
        .calls[0] as [Date];
      expect(Date.now() - cutoff.getTime()).toBe(
        PENDING_PHOTO_MAX_AGE_IN_SECONDS * 1000,
      );
      expect(mocks.uploadedFiles.deleteFiles).toHaveBeenCalledWith([
        'stale-key',
      ]);
    });

    it('keeps running when the cleanup fails', async () => {
      mocks.photoModel.deletePendingPhotosOlderThan.mockRejectedValue(
        new Error('db down'),
      );

      await expect(
        mocks.service.deleteStalePendingPhotos(),
      ).resolves.toBeUndefined();
    });

    it('runs the cleanup on an interval until the module stops', () => {
      vi.useFakeTimers();
      const cleanup = vi
        .spyOn(mocks.service, 'deleteStalePendingPhotos')
        .mockResolvedValue(undefined);

      mocks.service.onModuleInit();
      vi.advanceTimersByTime(60 * 60 * 1000);
      expect(cleanup).toHaveBeenCalledTimes(1);

      mocks.service.onModuleDestroy();
      vi.advanceTimersByTime(60 * 60 * 1000);
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });
});
