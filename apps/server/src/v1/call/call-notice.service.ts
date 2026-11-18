import { Injectable, Logger } from '@nestjs/common';
import { ConversationModel, MessageModel } from '@repo/models';
import { Types } from 'mongoose';
import type { CallNoticeType } from '../../types/call.type';
import { MessageGateway } from '../message/message.gateway';

@Injectable()
export class CallNoticeService {
  private readonly logger = new Logger(CallNoticeService.name);

  constructor(
    private readonly conversationModel: ConversationModel,
    private readonly messageModel: MessageModel,
    private readonly messageGateway: MessageGateway,
  ) {}

  async post({
    conversationId,
    userId,
    type,
    value = '',
  }: {
    conversationId: string;
    userId: string;
    type: CallNoticeType;
    value?: string;
  }) {
    try {
      const members =
        await this.conversationModel.getCallMembersByConversationId(
          conversationId,
        );
      if (!members) return;

      const notice = await this.messageModel.createMessage({
        conversation: new Types.ObjectId(conversationId),
        sender: new Types.ObjectId(userId),
        notice: { type, user: new Types.ObjectId(userId), value },
      });
      const message = await this.messageModel.findMessagePayloadById(
        notice._id,
      );
      if (!message) return;

      this.messageGateway.emitToUsers(
        members.map((member) => member.id),
        'MESSAGE',
        message,
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
