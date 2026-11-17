import { InternalServerErrorException } from '@nestjs/common';
import { Report } from '@repo/schemas';
import { Model } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportModel } from './report.model';

const REPORTER = '64b7f0c2a1b2c3d4e5f60701';
const REPORTED = '64b7f0c2a1b2c3d4e5f60702';
const CONVO = '64b7f0c2a1b2c3d4e5f60710';
const input = { reporter: REPORTER, reportedUser: REPORTED, conversation: CONVO, reason: 'spam' };

function build() {
  const collection = {
    create: vi.fn(async (doc: object) => ({ toJSON: () => ({ _id: 'r1', ...doc }) })),
  };

  return { collection, model: new ReportModel(collection as unknown as Model<Report>) };
}

describe('ReportModel', () => {
  let ctx: ReturnType<typeof build>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = build();
  });

  it('stores the report with its ids as ObjectIds', async () => {
    const report = await ctx.model.createReport(input);

    const [doc] = ctx.collection.create.mock.calls[0];
    expect(String(doc.reporter)).toBe(REPORTER);
    expect(String(doc.reportedUser)).toBe(REPORTED);
    expect(String(doc.conversation)).toBe(CONVO);
    expect(doc.reason).toBe('spam');
    expect(report._id).toBe('r1');
  });

  it('turns a driver failure into a 500', async () => {
    ctx.collection.create.mockRejectedValue(new Error('down'));

    await expect(ctx.model.createReport(input)).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
