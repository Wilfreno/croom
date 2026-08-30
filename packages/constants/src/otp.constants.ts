import { SECONDS_IN_HOUR, SECONDS_IN_MINUTE } from './time-in-seconds.constant';

export const OTP_RESEND_TIMER = SECONDS_IN_MINUTE;
export const OTP_EXPIRY_MINUTES = 5;

export const OTP_REQUEST_LIMIT = 2;

/**
 * How many pins may be live for one email at a time. Resending has to leave the
 * earlier code working -- mail is slow and users type whichever arrives first --
 * but every extra live pin is another value a guess can hit, so the window is
 * kept to the original plus a couple of resends rather than everything the
 * request limit could produce across a whole expiry window.
 */
export const OTP_MAX_LIVE = 3;

/** Consecutive wrong pins before the email is locked out of requesting again. */
export const OTP_MAX_ATTEMPTS = 3;

/** How long a locked-out email must wait before it may request a new pin. */
export const OTP_LOCKOUT_SECONDS = SECONDS_IN_HOUR;
