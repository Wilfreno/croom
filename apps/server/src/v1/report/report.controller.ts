import { Body, Controller, Post } from '@nestjs/common';
import { REPORT_LIMIT, REPORT_LIMIT_WINDOW } from '@repo/constants';
import { IsMember, RateLimit } from '@repo/guards';
import type { AuthenticatedUser } from '@repo/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportUserDto } from './dto/report-user.dto';
import { ReportService } from './report.service';

@Controller({ path: 'report', version: '1' })
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @RateLimit({ limit: REPORT_LIMIT, window: REPORT_LIMIT_WINDOW, by: 'user.id' })
  @IsMember({ body: 'conversationId' })
  @Post()
  reportUser(@CurrentUser() currentUser: AuthenticatedUser, @Body() { conversationId, user, reason }: ReportUserDto) {
    return this.reportService.reportUser({ conversationId, user, reason, userId: currentUser.id });
  }
}
