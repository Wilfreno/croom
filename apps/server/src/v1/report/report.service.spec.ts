import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConversationModel, ReportModel } from '@repo/models';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportService } from './report.service';

const ME = '64b7f0c2a1b2c3d4e5f60701';
const ADA = '64b7f0c2a1b2c3d4e5f60702';
const BOB = '64b7f0c2a1b2c3d4e5f60703';
const CONVO = '64b7f0c2a1b2c3d4e5f60710';

function build() {
  const conversationModel = {
    findConversationById: vi.fn().mockResolvedValue({ members: [ME, ADA] }),
  };
  const reportModel = { createReport: vi.fn().mockResolvedValue({ _id: 'r1' }) };
  const service = new ReportService(
    conversationModel as unknown as ConversationModel,
    reportModel as unknown as ReportModel,
  );

  return { service, conversationModel, reportModel };
}

describe('ReportService', () => {
  const query = { conversationId: CONVO, user: ADA, reason: 'spam', userId: ME };

  beforeEach(() => vi.clearAllMocks());

  it('files a report from the caller against a member of the conversation', async () => {
    const { service, conversationModel, reportModel } = build();

    await expect(service.reportUser(query)).resolves.toBeUndefined();
    expect(conversationModel.findConversationById).toHaveBeenCalledWith(CONVO);
    expect(reportModel.createReport).toHaveBeenCalledWith({
      reporter: ME,
      reportedUser: ADA,
      conversation: CONVO,
      reason: 'spam',
    });
  });

  it('refuses a report against yourself', async () => {
    const { service, conversationModel, reportModel } = build();

    await expect(service.reportUser({ ...query, user: ME })).rejects.toBeInstanceOf(BadRequestException);
    expect(conversationModel.findConversationById).not.toHaveBeenCalled();
    expect(reportModel.createReport).not.toHaveBeenCalled();
  });

  it('refuses a conversation that does not exist', async () => {
    const { service, conversationModel, reportModel } = build();
    conversationModel.findConversationById.mockResolvedValue(null);

    await expect(service.reportUser(query)).rejects.toBeInstanceOf(NotFoundException);
    expect(reportModel.createReport).not.toHaveBeenCalled();
  });

  it('refuses someone who is not in the conversation', async () => {
    const { service, reportModel } = build();

    await expect(service.reportUser({ ...query, user: BOB })).rejects.toBeInstanceOf(NotFoundException);
    expect(reportModel.createReport).not.toHaveBeenCalled();
  });
});
