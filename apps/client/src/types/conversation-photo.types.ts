import type { Photo } from '@repo/types';

export type ChangeConversationPhotoResult = { photo: Pick<Photo, 'id' | 'url'> };
