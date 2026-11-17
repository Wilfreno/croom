import type { AuthenticatedUser } from '@repo/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

const USER = { id: 'me' } as AuthenticatedUser;

function build() {
  const reportService = { reportUser: vi.fn().mockResolvedValue(undefined) };
  const controller = new ReportController(reportService as unknown as ReportService);
  return { controller, reportService };
}

describe('ReportController', () => {
  beforeEach(() => vi.clearAllMocks());

  it('files a report on behalf of the caller', async () => {
    const { controller, reportService } = build();

    await controller.reportUser(USER, { conversationId: 'c1', user: 'ada', reason: 'spam' });

    expect(reportService.reportUser).toHaveBeenCalledWith({
      conversationId: 'c1',
      user: 'ada',
      reason: 'spam',
      userId: 'me',
    });
  });
});
