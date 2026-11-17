import { REPORT_REASON_MAX_LENGTH } from '@repo/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ReportUserDto } from './report-user.dto';

const CONVO = '64b7f0c2a1b2c3d4e5f60710';
const USER = '64b7f0c2a1b2c3d4e5f60702';

async function check(body: object) {
  const dto = plainToInstance(ReportUserDto, body);
  return { dto, errors: await validate(dto) };
}

describe('ReportUserDto', () => {
  it('trims the reason', async () => {
    const { dto, errors } = await check({ conversationId: CONVO, user: USER, reason: '  spam  ' });

    expect(errors).toEqual([]);
    expect(dto.reason).toBe('spam');
  });

  it('accepts a reason at the length cap', async () => {
    const reason = 'x'.repeat(REPORT_REASON_MAX_LENGTH);

    expect((await check({ conversationId: CONVO, user: USER, reason })).errors).toEqual([]);
  });

  it.each([
    ['a conversation that is not an id', { conversationId: 'c1', user: USER, reason: 'spam' }],
    ['a user that is not an id', { conversationId: CONVO, user: 'ada', reason: 'spam' }],
    ['a missing reason', { conversationId: CONVO, user: USER }],
    ['a blank reason', { conversationId: CONVO, user: USER, reason: '   ' }],
    ['a reason that is not text', { conversationId: CONVO, user: USER, reason: 3 }],
    ['a reason that is too long', { conversationId: CONVO, user: USER, reason: 'x'.repeat(REPORT_REASON_MAX_LENGTH + 1) }],
  ])('refuses %s', async (_, body) => {
    expect((await check(body)).errors).not.toEqual([]);
  });
});
