import { USER_NAME_MAX_LENGTH, USER_NAME_MIN_LENGTH } from '@repo/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ChangeUserNameDto } from './change-user-name.dto';

async function check(body: object) {
  const dto = plainToInstance(ChangeUserNameDto, body);
  return { dto, errors: await validate(dto) };
}

describe('ChangeUserNameDto', () => {
  it('trims the username and drops a leading @', async () => {
    const { dto, errors } = await check({ userName: '  @ada.l_01 ' });

    expect(errors).toEqual([]);
    expect(dto.userName).toBe('ada.l_01');
  });

  it.each([
    ['a missing username', {}],
    ['a username that is not text', { userName: 3 }],
    ['a username with spaces', { userName: 'ada lovelace' }],
    ['a username with symbols', { userName: 'ada!' }],
    ['a username with an @ in the middle', { userName: 'ada@home' }],
    [
      'a username that is too short',
      { userName: 'x'.repeat(USER_NAME_MIN_LENGTH - 1) },
    ],
    [
      'a username that is too long',
      { userName: 'x'.repeat(USER_NAME_MAX_LENGTH + 1) },
    ],
  ])('refuses %s', async (_, body) => {
    expect((await check(body)).errors).not.toEqual([]);
  });
});
