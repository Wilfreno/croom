import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CONVERSATION_PHOTO_UPLOAD_ENDPOINT,
  MAX_PHOTOS_PER_MESSAGE,
  MESSAGE_PHOTOS_UPLOAD_ENDPOINT,
  PENDING_PHOTO_CLEANUP_INTERVAL_IN_SECONDS,
  PENDING_PHOTO_MAX_AGE_IN_SECONDS,
  PROFILE_PHOTO_UPLOAD_ENDPOINT,
  UPLOAD_ROUTE,
  UPLOADED_PHOTO_MAX_FILE_SIZE,
} from '@repo/constants';
import { PhotoType } from '@repo/enums';
import { PhotoModel } from '@repo/models';
import { requireEnv } from '@repo/utils';
import {
  createRouteHandler,
  createUploadthing,
  type FileRouter,
  UploadThingError,
} from 'uploadthing/server';
import { UploadedFilesService } from '../../common/uploaded-files/uploaded-files.service';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';

const MILLISECONDS_IN_SECOND = 1000;

type UploadedFile = { key: string; ufsUrl: string };

@Injectable()
export class UploadService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UploadService.name);
  readonly router: FileRouter = this.createRouter();
  private readonly handler: (request: Request) => Promise<Response>;
  private readonly sessionTokens = new WeakMap<Request, string>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly photoModel: PhotoModel,
    private readonly uploadedFiles: UploadedFilesService,
    configService: ConfigService,
  ) {
    const serverUrl = requireEnv(configService, 'SERVER_URL').replace(
      /\/+$/,
      '',
    );

    this.handler = createRouteHandler({
      router: this.router,
      config: {
        token: requireEnv(configService, 'UPLOADTHING_TOKEN'),
        callbackUrl: `${serverUrl}/v1/${UPLOAD_ROUTE}`,
      },
    });
  }

  onModuleInit() {
    this.cleanupTimer = setInterval(
      () => void this.deleteStalePendingPhotos(),
      PENDING_PHOTO_CLEANUP_INTERVAL_IN_SECONDS * MILLISECONDS_IN_SECOND,
    );
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  handle(request: Request, sessionToken?: string) {
    if (sessionToken) this.sessionTokens.set(request, sessionToken);

    return this.handler(request);
  }

  async deletePendingPhoto({
    requesterId,
    photoId,
  }: {
    requesterId: string;
    photoId: string;
  }) {
    const deletedKey = await this.photoModel.deletePendingPhoto({
      photoId,
      ownerId: requesterId,
    });
    if (deletedKey === null)
      throw new NotFoundException('photo does not exist');

    await this.uploadedFiles.deleteFiles([deletedKey]);
  }

  async deleteStalePendingPhotos() {
    try {
      const cutoff = new Date(
        Date.now() - PENDING_PHOTO_MAX_AGE_IN_SECONDS * MILLISECONDS_IN_SECOND,
      );
      const deletedKeys =
        await this.photoModel.deletePendingPhotosOlderThan(cutoff);

      await this.uploadedFiles.deleteFiles(deletedKeys);
    } catch (error) {
      this.logger.error(error);
    }
  }

  private createRouter() {
    const upload = createUploadthing();
    const authenticate = async ({ req }: { req: Request }) => {
      const uploader = await this.resolveUploader(req);
      return { uploaderId: uploader.id };
    };

    return {
      [PROFILE_PHOTO_UPLOAD_ENDPOINT]: upload({
        image: {
          minFileCount: 1,
          maxFileCount: 1,
          maxFileSize: UPLOADED_PHOTO_MAX_FILE_SIZE,
        },
      })
        .middleware(authenticate)
        .onUploadComplete(({ metadata, file }) =>
          this.deleteFileIfFailed(file, () =>
            this.userService.uploadProfilePhoto({
              requesterId: metadata.uploaderId,
              photo: { key: file.key, url: file.ufsUrl },
            }),
          ),
        ),
      [MESSAGE_PHOTOS_UPLOAD_ENDPOINT]: upload({
        image: {
          minFileCount: 1,
          maxFileCount: MAX_PHOTOS_PER_MESSAGE,
          maxFileSize: UPLOADED_PHOTO_MAX_FILE_SIZE,
        },
      })
        .middleware(authenticate)
        .onUploadComplete(({ metadata, file }) =>
          this.savePendingPhoto({
            uploaderId: metadata.uploaderId,
            type: PhotoType.MESSAGE,
            file,
          }),
        ),
      [CONVERSATION_PHOTO_UPLOAD_ENDPOINT]: upload({
        image: {
          minFileCount: 1,
          maxFileCount: 1,
          maxFileSize: UPLOADED_PHOTO_MAX_FILE_SIZE,
        },
      })
        .middleware(authenticate)
        .onUploadComplete(({ metadata, file }) =>
          this.savePendingPhoto({
            uploaderId: metadata.uploaderId,
            type: PhotoType.CONVERSATION,
            file,
          }),
        ),
    };
  }

  private savePendingPhoto({
    uploaderId,
    type,
    file,
  }: {
    uploaderId: string;
    type: PhotoType;
    file: UploadedFile;
  }) {
    return this.deleteFileIfFailed(file, async () => {
      const photo = await this.photoModel.createPending({
        ownerId: uploaderId,
        type,
        key: file.key,
        url: file.ufsUrl,
      });
      return { photo };
    });
  }

  private async deleteFileIfFailed<T>(
    file: UploadedFile,
    save: () => Promise<T>,
  ) {
    try {
      return await save();
    } catch (error) {
      await this.uploadedFiles.deleteFiles([file.key]);
      throw error;
    }
  }

  private async resolveUploader(request: Request) {
    const sessionToken = this.sessionTokens.get(request);

    if (!sessionToken) throw forbidden('you are not logged in');

    const uploader = await this.authService.resolveSession(sessionToken);

    if (!uploader) throw forbidden('your session has expired, log in again');

    return uploader;
  }
}

function forbidden(message: string): Error {
  return new UploadThingError({ code: 'FORBIDDEN', message });
}
