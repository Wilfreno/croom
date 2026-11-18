import type { Photo } from '@repo/types';

export type UploadedPhotoResult = { photo: Pick<Photo, 'id' | 'url'> };
