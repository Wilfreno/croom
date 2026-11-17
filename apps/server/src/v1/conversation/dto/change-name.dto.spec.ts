import { CONVERSATION_NAME_MAX_LENGTH } from '@repo/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ChangeNameDto } from './change-name.dto';

async function check(body: object) {
  const dto = plainToInstance(ChangeNameDto, body);
  return { dto, errors: await validate(dto) };
}

describe('ChangeNameDto', () => {
  it('trims the name', async () => {
    const { dto, errors } = await check({ name: '  Squad  ' });

    expect(errors).toEqual([]);
    expect(dto.name).toBe('Squad');
  });

  it('accepts an empty name to clear it', async () => {
    expect((await check({ name: '' })).errors).toEqual([]);
  });

  it.each([
    ['a missing name', {}],
    ['a name that is not text', { name: 3 }],
    [
      'a name that is too long',
      { name: 'x'.repeat(CONVERSATION_NAME_MAX_LENGTH + 1) },
    ],
  ])('refuses %s', async (_, body) => {
    expect((await check(body)).errors).not.toEqual([]);
  });
});
