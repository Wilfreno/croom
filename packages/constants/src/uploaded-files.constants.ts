import { SECONDS_IN_DAY, SECONDS_IN_HOUR } from './time-in-seconds.constant';

export const UPLOADTHING_API = 'UPLOADTHING_API';
export const UPLOAD_ROUTE = 'upload';
export const PROFILE_PHOTO_UPLOAD_ENDPOINT = 'profilePhoto';
export const MESSAGE_PHOTOS_UPLOAD_ENDPOINT = 'messagePhotos';
export const CONVERSATION_PHOTO_UPLOAD_ENDPOINT = 'conversationPhoto';
export const UPLOADED_PHOTO_MAX_FILE_SIZE = '4MB';
export const MAX_PHOTOS_PER_MESSAGE = 30;
export const PENDING_PHOTO_MAX_AGE_IN_SECONDS = SECONDS_IN_DAY;
export const PENDING_PHOTO_CLEANUP_INTERVAL_IN_SECONDS = SECONDS_IN_HOUR;
