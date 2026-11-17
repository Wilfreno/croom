import { NICKNAME_MAX_LENGTH } from '@repo/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { SetNicknameDto } from './set-nickname.dto';

const USER = '64b7f0c2a1b2c3d4e5f60702';

async function check(body: object) {
  const dto = plainToInstance(SetNicknameDto, body);
  return { dto, errors: await validate(dto) };
}

describe('SetNicknameDto', () => {
  it('trims the nickname', async () => {
    const { dto, errors } = await check({ user: USER, value: '  Ace  ' });

    expect(errors).toEqual([]);
    expect(dto.value).toBe('Ace');
  });

  it('accepts an empty nickname to clear it', async () => {
    expect((await check({ user: USER, value: '' })).errors).toEqual([]);
  });

  it.each([
    ['a user that is not an id', { user: 'ada', value: 'Ace' }],
    ['a missing value', { user: USER }],
    ['a value that is not text', { user: USER, value: 3 }],
    ['a nickname that is too long', { user: USER, value: 'x'.repeat(NICKNAME_MAX_LENGTH + 1) }],
  ])('refuses %s', async (_, body) => {
    expect((await check(body)).errors).not.toEqual([]);
  });
});
