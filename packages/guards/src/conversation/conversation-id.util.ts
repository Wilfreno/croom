import { BadRequestException, ExecutionContext } from '@nestjs/common';

/**
 * Where a guard finds the conversation id on the request: a route param or a
 * body field, by name.
 *
 * @example
 * { param: 'conversationId' } // /conversation/:conversationId/...
 * { body: 'conversationId' }  // { "conversationId": "..." }
 */
export type ConversationIdSource = { param: string } | { body: string };

/**
 * The slice of the request these guards read. Typed structurally so the
 * package does not depend on the server's Fastify `request.user` augmentation.
 */
export interface ConversationGuardRequest {
  user?: { id: string };
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function getConversationGuardRequest(context: ExecutionContext) {
  return context.switchToHttp().getRequest<ConversationGuardRequest>();
}

/**
 * Reads the conversation id from wherever `source` points.
 *
 * Guards run before pipes, so the body has not been validated yet -- the id is
 * checked here and a bad one is a 400 rather than a Mongo cast error.
 */
export function getConversationId(
  context: ExecutionContext,
  source: ConversationIdSource | undefined,
  guardName: string,
): string {
  // Missing metadata means the guard was applied with `@UseGuards` directly
  // instead of through its decorator -- a programming error, not a bad request.
  if (!source)
    throw new Error(`${guardName} has no conversation id source; apply it through its decorator`);

  const request = getConversationGuardRequest(context);
  const name = 'param' in source ? source.param : source.body;
  const conversationId = 'param' in source ? request.params?.[name] : request.body?.[name];

  if (typeof conversationId !== 'string' || !OBJECT_ID_PATTERN.test(conversationId))
    throw new BadRequestException(`${name} must be a valid id`);

  return conversationId;
}
