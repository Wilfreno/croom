import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Report } from '@repo/schemas';
import { Model, Types } from 'mongoose';

type NewReport = { reporter: string; reportedUser: string; conversation: string; reason: string };

@Injectable()
export class ReportModel {
  private readonly logger = new Logger(ReportModel.name);

  constructor(@InjectModel(Report.name) private Report: Model<Report>) {}

  async createReport({ reporter, reportedUser, conversation, reason }: NewReport) {
    try {
      const report = await this.Report.create({
        reporter: new Types.ObjectId(reporter),
        reportedUser: new Types.ObjectId(reportedUser),
        conversation: new Types.ObjectId(conversation),
        reason,
      });

      return report.toJSON();
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
