import type { Photo } from '@repo/types';

export type ProfilePhoto = Pick<Photo, 'id' | 'url' | 'width' | 'height'>;

export type ChangeProfilePhotoResult = { photo: Pick<Photo, 'id' | 'url'> };

export type UploadedProfilePhoto = Pick<Photo, 'key' | 'url' | 'width' | 'height'>;

export type ChangePasswordForm = { currentPassword: string; password: string; confirmPassword: string };

export type ChangeProfilePhotoVariables = { uploaded: UploadedProfilePhoto } | { recentPhotoId: string };
