// The address the server listens on. Never 'localhost': when it resolves to both
// ::1 and 127.0.0.1, Fastify serves the second address from a separate HTTP
// server that Socket.IO isn't attached to, so /socket.io/ requests there 404.
export const SERVER_LISTEN_HOST = '127.0.0.1';

export const SERVER_AVAILABILITY_NOTICE = 'The app server is only available from 6:00 AM to 12:00 AM (PHT).';

export const SERVER_AVAILABILITY_BANNER_PATHS = ['/login', '/sign-up'];
