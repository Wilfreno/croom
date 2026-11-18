import { SECONDS_IN_MINUTE } from './time-in-seconds.constant';

export const MAX_RECENT_PROFILE_PHOTOS = 5;

export const DISPLAY_NAME_MAX_LENGTH = 50;

export const USER_NAME_MIN_LENGTH = 3;

export const USER_NAME_MAX_LENGTH = 30;

export const USER_NAME_PATTERN = /^[a-zA-Z0-9._]+$/;

export const DELETED_USER_DISPLAY_NAME = 'Deleted user';

export const PASSWORD_CHANGE_REQUEST_LIMIT = 5;

export const PASSWORD_CHANGE_REQUEST_WINDOW = SECONDS_IN_MINUTE * 15;

export const USER_NAME_COLLATION = { locale: 'en', strength: 2 };

export const USER_NAME_SUFFIX_ATTEMPTS = 10;

export const DUPLICATE_KEY_ERROR_CODE = 11000;
