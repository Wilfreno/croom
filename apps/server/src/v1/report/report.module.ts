import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationModel, ReportModel } from '@repo/models';
import { Conversation, ConversationSchema, Report, ReportSchema } from '@repo/schemas';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Report.name, schema: ReportSchema },
    ]),
  ],
  controllers: [ReportController],
  providers: [ReportService, ConversationModel, ReportModel],
})
export class ReportModule {}
