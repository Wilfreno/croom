import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGE_KEY, RESPONSE_STATUS_KEY } from '@repo/constants';
import type { ServerResponse, ServerResponseStatus } from '@repo/types';
import type { FastifyReply } from 'fastify';
import { Observable, map } from 'rxjs';
import {
  defaultMessage,
  toServerResponseStatus,
} from '../constants/server-response.constant';
import { isResponsePayload } from '../utils/server-response.util';

function isServerResponse(value: unknown): value is ServerResponse<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'message' in value &&
    'data' in value
  );
}

/**
 * Wraps every successful handler return value in the `ServerResponse` shape.
 *
 * A handler may return:
 *  - raw data — wrapped as `{ status, message, data }`
 *  - `respond(data, { message, status })` — same, with those two overridden
 *  - a full `ServerResponse` — passed through untouched
 *  - `undefined` — becomes `data: null`
 *
 * `message` and `status` are resolved in order: `respond()`, then the
 * `@ResponseMessage()` / `@ResponseStatus()` decorators, then the HTTP status
 * code and its default message.
 */
@Injectable()
export class ServerResponseInterceptor<T>
  implements NestInterceptor<T, ServerResponse<T | null>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ServerResponse<T | null>> {
    const reply = context.switchToHttp().getResponse<FastifyReply>();

    const message = this.reflector.getAllAndOverride<string | undefined>(
      RESPONSE_MESSAGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const status = this.reflector.getAllAndOverride<
      ServerResponseStatus | undefined
    >(RESPONSE_STATUS_KEY, [context.getHandler(), context.getClass()]);

    return next.handle().pipe(
      map((payload) => {
        const envelope = isResponsePayload(payload) ? payload : undefined;

        if (!envelope && isServerResponse(payload))
          return payload as ServerResponse<T>;

        const data = (envelope ? envelope.data : payload) ?? null;

        const responseStatus =
          envelope?.status ??
          status ??
          toServerResponseStatus(reply.statusCode);

        return {
          status: responseStatus,
          message:
            envelope?.message ?? message ?? defaultMessage(responseStatus),
          data: data as T | null,
        };
      }),
    );
  }
}
