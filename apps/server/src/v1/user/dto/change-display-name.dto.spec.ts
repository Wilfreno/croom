import { DISPLAY_NAME_MAX_LENGTH } from '@repo/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ChangeDisplayNameDto } from './change-display-name.dto';

async function check(body: object) {
  const dto = plainToInstance(ChangeDisplayNameDto, body);
  return { dto, errors: await validate(dto) };
}

describe('ChangeDisplayNameDto', () => {
  it('trims the display name', async () => {
    const { dto, errors } = await check({ displayName: '  Ada  ' });

    expect(errors).toEqual([]);
    expect(dto.displayName).toBe('Ada');
  });

  it.each([
    ['a missing display name', {}],
    ['a blank display name', { displayName: '   ' }],
    ['a display name that is not text', { displayName: 3 }],
    [
      'a display name that is too long',
      { displayName: 'x'.repeat(DISPLAY_NAME_MAX_LENGTH + 1) },
    ],
  ])('refuses %s', async (_, body) => {
    expect((await check(body)).errors).not.toEqual([]);
  });
});
