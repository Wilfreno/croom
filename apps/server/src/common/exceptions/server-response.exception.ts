import { HttpException, HttpStatus } from '@nestjs/common';
import type { ServerResponseStatus } from '@repo/types';

const SERVER_STATUS_TO_HTTP: Record<ServerResponseStatus, number> = {
  OK: HttpStatus.OK,
  CREATED: HttpStatus.CREATED,
  'BAD REQUEST': HttpStatus.BAD_REQUEST,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  'NOT FOUND': HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  'OUT OF BOUND': HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
  BLOCKED: 423, // Locked
  'TOO MANY REQUESTS': HttpStatus.TOO_MANY_REQUESTS,
  'INTERNAL SERVER ERROR': HttpStatus.INTERNAL_SERVER_ERROR,
};

/**
 * Throw this when you want to pick the `ServerResponse["status"]` yourself
 * instead of letting the HTTP status code decide it. Required for `BLOCKED`
 * and `OUT_OF_BOUND`, which have no obvious HTTP equivalent.
 *
 * @example
 * throw new ServerException('BLOCKED', 'this account is blocked');
 */
export class ServerException extends HttpException {
  readonly serverStatus: ServerResponseStatus;

  constructor(status: ServerResponseStatus, message: string) {
    super(message, SERVER_STATUS_TO_HTTP[status]);
    this.serverStatus = status;
  }
}
