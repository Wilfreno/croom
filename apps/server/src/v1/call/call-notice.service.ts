import { Injectable, Logger } from '@nestjs/common';
import { MessageNoticeType } from '@repo/enums';
import { ConversationModel, MessageModel } from '@repo/models';
import { Types } from 'mongoose';
import { MessageGateway } from '../message/message.gateway';

type CallNoticeType =
  | MessageNoticeType.CALL_RING
  | MessageNoticeType.CALL_STARTED
  | MessageNoticeType.CALL_ENDED;

/** Writes "started a call", "call started" and "call ended" into the conversation and sends them to its members. */
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
