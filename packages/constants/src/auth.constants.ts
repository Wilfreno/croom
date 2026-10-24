import { SECONDS_IN_DAY, SECONDS_IN_MINUTE } from './time-in-seconds.constant';

/** Name of the cookie the session token travels in. */
export const SESSION_COOKIE = 'croom_session';

/**
 * How long a session stays usable. The same value drives the cookie's `maxAge`
 * and the TTL index on the session collection, so the copy in the browser and
 * the record behind it die together.
 */
export const SESSION_LIFETIME_SECONDS = SECONDS_IN_DAY * 30;

/** Bytes of entropy in a session token, before hex encoding doubles the length. */
export const SESSION_TOKEN_BYTES = 32;

/** Name of the short-lived cookie the oauth `state` value travels in. */
export const OAUTH_STATE_COOKIE = 'croom_oauth_state';

/**
 * How long a caller has to finish the google handshake. Long enough to sit on
 * the consent screen, short enough that an abandoned attempt cannot be replayed
 * later.
 */
export const OAUTH_STATE_LIFETIME_SECONDS = SECONDS_IN_MINUTE * 10;

/**
 * Metadata key used by the `@Public()` decorator. Routes are authenticated by
 * default, so this is the only way out.
 */
export const AUTH_PUBLIC_KEY = 'auth:public';

/** How many login attempts one email address may make inside a minute. */
export const LOGIN_REQUEST_LIMIT = 5;

export const LOGIN_REQUEST_WINDOW = SECONDS_IN_MINUTE;

/**
 * The one message every failed login gets, whatever actually went wrong. Naming
 * which half was wrong would turn the route into an account-enumeration oracle.
 */
export const INVALID_CREDENTIALS = 'invalid email or password';
