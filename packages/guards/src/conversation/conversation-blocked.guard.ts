import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConversationModel } from '@repo/models';
import {
  ConversationIdSource,
  getConversationGuardRequest,
  getConversationId,
} from './conversation-id.util';
import { isFirstMessageRequest } from './conversation-first-message.guard';

export const CONVERSATION_BLOCKED_SOURCE_KEY = 'conversationBlockedSource';

/** HTTP status the server maps to the `BLOCKED` response status. */
const BLOCKED_HTTP_STATUS = 423;

/**
 * Rejects the request with `BLOCKED` (423) when the session user is the one
 * blocked in the conversation it targets. The blocker is let through.
 *
 * A conversation that does not exist is not blocked, so this passes; pair it
 * with `@IsMember()` to reject those. Relies on the session guard having set
 * `request.user` first. The module using it must provide `ConversationModel`.
 * Apply it through `@NotBlocked()`, which tells it where the conversation id is.
 */
@Injectable()
export class ConversationBlockedGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly conversationModel: ConversationModel,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const source = this.reflector.getAllAndOverride<ConversationIdSource | undefined>(CONVERSATION_BLOCKED_SOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // First message of a not-yet-created conversation: see `@IsFirstMessage()`.
    if (isFirstMessageRequest(context, this.reflector, source)) return true;

    const conversationId = getConversationId(context, source, ConversationBlockedGuard.name);
    const userId = getConversationGuardRequest(context).user?.id;

    if (!userId) throw new UnauthorizedException('you are not logged in');

    if (await this.conversationModel.isUserBlockedInConversation({ conversationId, userId }))
      throw new HttpException('you are blocked in this conversation', BLOCKED_HTTP_STATUS);

    return true;
  }
}

/**
 * Rejects the request with `BLOCKED` (423) when the session user is the one
 * blocked in the conversation, read from wherever `source` points. The user
 * who did the blocking is let through.
 *
 * Put it ABOVE `@IsMember()`: stacked guard decorators run bottom-up, so this
 * order checks membership first and non-members can't learn whether a
 * conversation is blocked. The module using it must provide `ConversationModel`.
 *
 * @example
 * ＠NotBlocked({ body: 'conversationId' })
 * ＠IsMember({ body: 'conversationId' })
 * ＠Post()
 * create(＠Body() createMessageDto: CreateMessageDto) {}
 */
export const NotBlocked = (source: ConversationIdSource) =>
  applyDecorators(SetMetadata(CONVERSATION_BLOCKED_SOURCE_KEY, source), UseGuards(ConversationBlockedGuard));
