import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConversationIdSource, getConversationGuardRequest } from './conversation-id.util';

export const CONVERSATION_FIRST_MESSAGE_KEY = 'conversationFirstMessage';

/** Body field holding the conversation id on a follow-up message. */
const CONVERSATION_ID_FIELD = 'conversationId';
/** Body field holding the other members' ids on a first message. */
const MEMBERS_FIELD = 'members';

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

/**
 * True when the route allows a first message (`@IsFirstMessage()`) and the
 * conversation id `source` points at is absent from the body -- the
 * conversation does not exist yet, so there is nothing to be a member of or
 * blocked in. `@IsMember()` and `@NotBlocked()` pass in that case and leave
 * the request to `ConversationFirstMessageGuard`.
 *
 * A present but malformed id is NOT a first message; the caller still rejects it.
 */
export function isFirstMessageRequest(
  context: ExecutionContext,
  reflector: Reflector,
  source: ConversationIdSource | undefined,
): boolean {
  if (!source || !('body' in source)) return false;

  const allowsFirstMessage = reflector.getAllAndOverride<boolean | undefined>(CONVERSATION_FIRST_MESSAGE_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);

  if (!allowsFirstMessage) return false;

  return getConversationGuardRequest(context).body?.[source.body] == null;
}

/**
 * Validates the two shapes a send-message request can take:
 * - follow-up: `conversationId` set, `members` absent -- membership and
 *   blocking are checked by `@IsMember()` / `@NotBlocked()`.
 * - first message: `conversationId` absent, `members` a non-empty list of
 *   user ids -- the service creates the conversation and the message together.
 *
 * Guards run before pipes, so the shape is checked here rather than trusting
 * the DTO, which has not run yet. Apply it through `@IsFirstMessage()`.
 */
@Injectable()
export class ConversationFirstMessageGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = getConversationGuardRequest(context);

    if (!request.user?.id) throw new UnauthorizedException('you are not logged in');

    const conversationId = request.body?.[CONVERSATION_ID_FIELD];
    const members = request.body?.[MEMBERS_FIELD];

    if (conversationId != null) {
      if (members != null)
        throw new BadRequestException(`send either ${CONVERSATION_ID_FIELD} or ${MEMBERS_FIELD}, not both`);

      return true;
    }

    if (
      !Array.isArray(members) ||
      members.length === 0 ||
      !members.every((id) => typeof id === 'string' && OBJECT_ID_PATTERN.test(id))
    )
      throw new BadRequestException(
        `${MEMBERS_FIELD} must be a non-empty list of valid ids when ${CONVERSATION_ID_FIELD} is not sent`,
      );

    return true;
  }
}

/**
 * Lets a route accept the first message of a conversation that does not exist
 * yet: when the body has no `conversationId`, `@IsMember()` and
 * `@NotBlocked()` on the same route pass, and the body must carry `members`
 * instead. With a `conversationId`, those guards run as usual.
 *
 * Order-independent: the bypass is read from route metadata, not from guard
 * execution order. The service is responsible for creating the conversation
 * (and refusing a duplicate 1:1) in the same transaction as the message.
 *
 * @example
 * ＠IsFirstMessage()
 * ＠NotBlocked({ body: 'conversationId' })
 * ＠IsMember({ body: 'conversationId' })
 * ＠Post()
 * create(＠Body() createMessageDto: CreateMessageDto) {}
 */
export const IsFirstMessage = () =>
  applyDecorators(SetMetadata(CONVERSATION_FIRST_MESSAGE_KEY, true), UseGuards(ConversationFirstMessageGuard));
