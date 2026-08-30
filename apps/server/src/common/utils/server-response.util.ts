import { RESPONSE_PAYLOAD } from '@repo/types';
import type { ResponseOptions, ResponsePayload } from '@repo/types';

/**
 * Sets the `message` and/or `status` of the wrapped `ServerResponse` from
 * inside a handler or service, when they are not known ahead of time.
 * Anything omitted falls back to the `@ResponseMessage()` / `@ResponseStatus()`
 * decorators, then to the HTTP status code.
 *
 * @example
 * ＠Get(':id')
 * findOne(＠Param('id') id: string) {
 *   const user = await this.userService.findOne(id);
 *   return respond(user, { message: `found ${user.name}` });
 * }
 *
 * @example a message with no data
 * return respond(null, { message: 'hello world' });
 */
export function respond<T>(
  data: T,
  options: ResponseOptions = {},
): ResponsePayload<T> {
  return {
    [RESPONSE_PAYLOAD]: true,
    status: options.status,
    message: options.message,
    data,
  };
}

export function isResponsePayload(
  value: unknown,
): value is ResponsePayload<unknown> {
  return (
    typeof value === 'object' && value !== null && RESPONSE_PAYLOAD in value
  );
}
