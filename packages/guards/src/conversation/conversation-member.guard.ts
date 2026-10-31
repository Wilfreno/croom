import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConversationModel } from '@repo/models';
import { ConversationIdSource, getConversationGuardRequest, getConversationId } from './conversation-id.util';

export const CONVERSATION_MEMBER_SOURCE_KEY = 'conversationMemberSource';

/**
 * Lets the request through only when the session user is a member of the
 * conversation it targets.
 *
 * Relies on the session guard having set `request.user` first. The module
 * using it must provide `ConversationModel`. Apply it through `@IsMember()`,
 * which tells it where the conversation id is.
 */
@Injectable()
export class ConversationMemberGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly conversationModel: ConversationModel,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const conversationId = getConversationId(
      context,
      this.reflector.getAllAndOverride<ConversationIdSource | undefined>(CONVERSATION_MEMBER_SOURCE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]),
      ConversationMemberGuard.name,
    );
    const userId = getConversationGuardRequest(context).user?.id;

    if (!userId) throw new UnauthorizedException('you are not logged in');

    const isMember = await this.conversationModel.isConversationMember({ conversationId, userId });

    if (!isMember) throw new ForbiddenException('you are not a member of this conversation');

    return true;
  }
}

/**
 * Only lets the session user through if they are a member of the conversation,
 * read from wherever `source` points. The module using it must provide
 * `ConversationModel`.
 *
 * @example
 * ＠IsMember({ body: 'conversationId' })
 * ＠Post()
 * create(＠Body() createMessageDto: CreateMessageDto) {}
 *
 * ＠IsMember({ param: 'conversationId' })
 * ＠Get(':conversationId/messages')
 * findMessages() {}
 */
export const IsMember = (source: ConversationIdSource) =>
  applyDecorators(SetMetadata(CONVERSATION_MEMBER_SOURCE_KEY, source), UseGuards(ConversationMemberGuard));
