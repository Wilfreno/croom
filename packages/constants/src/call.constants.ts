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
