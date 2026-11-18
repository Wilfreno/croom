// Current user's draggable/resizable camera tile on the call screen
export const CALL_TILE_ASPECT_RATIO = 16 / 9;
export const CALL_TILE_MIN_WIDTH = 160;
export const CALL_TILE_MAX_WIDTH_RATIO = 0.6; // fraction of the call area's width
export const CALL_TILE_INITIAL_WIDTH = 240;

// How long an incoming-call toast keeps ringing before it disappears on its own
export const CALL_RING_DURATION_MS = 30_000;

// Participant grid: at most this many tiles; past it, the last tile summarizes everyone not shown
export const CALL_MAX_VISIBLE_TILES = 12;
export const CALL_OVERFLOW_AVATAR_COUNT = 3; // avatars stacked on that summary tile
// Up to this many people (you included), your camera floats; with more, it becomes a tile in the grid
export const CALL_FLOATING_SELF_VIEW_MAX_PEOPLE = 2;

// How long to wait for the server to reply to a socket event before giving up
export const SOCKET_SERVER_REPLY_TIMEOUT_MS = 10_000;
// Space between participant tiles in the call grid
export const CALL_TILE_GAP = '0.5rem';
// Upper limit on the video each person sends (bits per second); keeps server CPU and upload bandwidth down
export const CALL_VIDEO_MAX_BITRATE = 500_000;
export const CALL_MEDIA_PREFERENCES_STORAGE_KEY = 'call:media-preferences';
export const CALL_DEFAULT_MEDIA_PREFERENCES = { isCameraOn: false, isMicOn: true };
export const CALL_PINNED_SIDE_MAX_TILES = 5;
export const CALL_SIDE_PANEL_DOCKED_MEDIA_QUERY = '(min-width: 640px)';
export const CALL_SIDE_PANEL_TRANSITION_SECONDS = 0.25;
export const CALL_RINGBACK_TONE = {
  volume: 0.08,
  cycleSeconds: 6,
  notes: [{ startSeconds: 0, durationSeconds: 2, frequencies: [440, 480] }],
};
export const CALL_RINGTONE_URL = '/sounds/incoming-call.mp3';
export const CALL_RINGTONE_VOLUME = 1;
export const RINGTONE_FADE_SECONDS = 0.02;
export const CALL_NO_LONGER_RINGING = 'This call is no longer ringing';
export const OUTGOING_CALL_STATUS_TEXT = {
  ringing: 'Calling…',
  declined: 'Call declined',
  unanswered: 'No answer',
};
export const CALL_SIDE_PANEL_DOCKED_MOTION = {
  initial: { width: 0 },
  animate: { width: 'auto' },
  exit: { width: 0 },
};
export const CALL_SIDE_PANEL_OVERLAY_MOTION = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
};
