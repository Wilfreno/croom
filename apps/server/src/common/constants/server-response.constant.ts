import { HttpStatus } from '@nestjs/common';
import type { ServerResponseStatus } from '@repo/types';

const HTTP_STATUS_MAP: Record<number, ServerResponseStatus> = {
  [HttpStatus.OK]: 'OK',
  [HttpStatus.CREATED]: 'CREATED',
  [HttpStatus.BAD_REQUEST]: 'BAD REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE]: 'OUT OF BOUND',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO MANY REQUESTS',
  423: 'BLOCKED', // Locked
};

/**
 * Maps an HTTP status code onto the `ServerResponse["status"]` union.
 */
export function toServerResponseStatus(
  httpStatus: number,
): ServerResponseStatus {
  const mapped = HTTP_STATUS_MAP[httpStatus];
  if (mapped) return mapped;

  if (httpStatus >= 500) return 'INTERNAL SERVER ERROR';
  if (httpStatus >= 400) return 'BAD REQUEST';

  return 'OK';
}

const DEFAULT_MESSAGE_MAP: Record<ServerResponseStatus, string> = {
  OK: 'success',
  CREATED: 'created',
  'BAD REQUEST': 'bad request',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  'NOT FOUND': 'not found',
  CONFLICT: 'conflict',
  'OUT OF BOUND': 'out of bound',
  BLOCKED: 'blocked',
  'TOO MANY REQUESTS': 'too many requests',
  'INTERNAL SERVER ERROR': 'internal server error',
};

export function defaultMessage(status: ServerResponseStatus): string {
  return DEFAULT_MESSAGE_MAP[status];
}
