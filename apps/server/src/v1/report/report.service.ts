import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConversationModel, ReportModel } from '@repo/models';
import { ReportUserDto } from './dto/report-user.dto';

@Injectable()
export class ReportService {
  constructor(
    private readonly conversationModel: ConversationModel,
    private readonly reportModel: ReportModel,
  ) {}

  async reportUser({ conversationId, user, reason, userId }: ReportUserDto & { userId: string }) {
    if (user === userId) throw new BadRequestException('you cannot report yourself');

    const conversation = await this.conversationModel.findConversationById(conversationId);

    if (!conversation) throw new NotFoundException('conversation does not exist');
    if (!conversation.members.some((member) => String(member) === user))
      throw new NotFoundException('user is not a member of this conversation');

    await this.reportModel.createReport({
      reporter: userId,
      reportedUser: user,
      conversation: conversationId,
      reason,
    });
  }
}
