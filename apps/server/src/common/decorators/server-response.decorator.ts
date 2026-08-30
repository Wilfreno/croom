import { SetMetadata, applyDecorators } from '@nestjs/common';
import type { ServerResponseStatus } from '@repo/types';
import { RESPONSE_MESSAGE_KEY, RESPONSE_STATUS_KEY } from '@repo/constants';

/**
 * Sets the `message` of the wrapped `ServerResponse` for a handler or a whole
 * controller.
 *
 * @example
 * ＠ResponseMessage('user created')
 * ＠Post()
 * signUp(＠Body() dto: SignUpDto) {
 *   return this.authService.signUp(dto);
 * }
 */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);

/**
 * Overrides the `status` of the wrapped `ServerResponse`. Only needed for the
 * statuses that have no natural HTTP code (`OUT_OF_BOUND`, `BLOCKED`) or when
 * you want a status that differs from the HTTP status code.
 */
export const ResponseStatus = (status: ServerResponseStatus) =>
  SetMetadata(RESPONSE_STATUS_KEY, status);

/**
 * `@ResponseMessage()` and `@ResponseStatus()` in one, for when a handler needs
 * both. Works on a single handler or on a whole controller, where it becomes
 * the default for every route the controller declares.
 *
 * Named `Respond` rather than `Response` so it cannot be confused with Nest's
 * `@Response()` parameter decorator. It is the static counterpart of the
 * `respond()` helper, which sets the same two fields at runtime.
 *
 * @example
 * ＠Respond({ status: 'CREATED', message: 'user created' })
 * ＠Post()
 * signUp(＠Body() dto: SignUpDto) {
 *   return this.authService.signUp(dto);
 * }
 */
export const Respond = (options: {
  status?: ServerResponseStatus;
  message?: string;
}) =>
  applyDecorators(
    ...(options.message ? [ResponseMessage(options.message)] : []),
    ...(options.status ? [ResponseStatus(options.status)] : []),
  );
