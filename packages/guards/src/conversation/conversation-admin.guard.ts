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

export const CONVERSATION_ADMIN_SOURCE_KEY = 'conversationAdminSource';

@Injectable()
export class ConversationAdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly conversationModel: ConversationModel,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const source = this.reflector.getAllAndOverride<ConversationIdSource | undefined>(CONVERSATION_ADMIN_SOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const conversationId = getConversationId(context, source, ConversationAdminGuard.name);
    const userId = getConversationGuardRequest(context).user?.id;

    if (!userId) throw new UnauthorizedException('you are not logged in');

    const isAdmin = await this.conversationModel.isConversationAdmin({ conversationId, userId });

    if (!isAdmin) throw new ForbiddenException('you are not an admin of this conversation');

    return true;
  }
}

export const IsAdmin = (source: ConversationIdSource) =>
  applyDecorators(SetMetadata(CONVERSATION_ADMIN_SOURCE_KEY, source), UseGuards(ConversationAdminGuard));
