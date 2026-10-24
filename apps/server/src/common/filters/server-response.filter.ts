import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ServerResponse } from '@repo/types';
import type { FastifyReply } from 'fastify';
import {
  defaultMessage,
  toServerResponseStatus,
} from '../constants/server-response.constant';
import { ServerException } from '../exceptions/server-response.exception';

/**
 * Reads the message out of whatever `HttpException.getResponse()` returns.
 * `ValidationPipe` hands back `{ message: string[] }`, most others a string.
 */
function extractMessage(exception: HttpException): string {
  const response = exception.getResponse();

  if (typeof response === 'string') return response;

  const message = (response as { message?: unknown }).message;

  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;

  return exception.message;
}

/**
 * Turns every thrown error into the `ServerResponse` shape, so error responses
 * look exactly like successful ones to the client.
 */
@Catch()
export class ServerResponseFilter implements ExceptionFilter {
  private readonly logger = new Logger(ServerResponseFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse<FastifyReply>();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const status =
      exception instanceof ServerException
        ? exception.serverStatus
        : toServerResponseStatus(httpStatus);

    const message =
      exception instanceof HttpException
        ? extractMessage(exception)
        : defaultMessage(status);

    if (!(exception instanceof HttpException))
      this.logger.error(
        exception instanceof Error ? exception.message : 'unknown error',
        exception instanceof Error ? exception.stack : undefined,
      );

    const body: ServerResponse = { status, message, data: null };

    void reply.status(httpStatus).send(body);
  }
}
