import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { requireEnv } from './get-env.util';

const configWith = (value: unknown) =>
  ({ get: vi.fn().mockReturnValue(value) }) as unknown as ConfigService;

describe('requireEnv', () => {
  it('returns the value for a key that is set', () => {
    expect(requireEnv(configWith('mongodb://localhost'), 'MONGO_URI')).toBe(
      'mongodb://localhost',
    );
  });

  it('trims surrounding whitespace', () => {
    expect(requireEnv(configWith('  value  '), 'KEY')).toBe('value');
  });

  it.each([
    ['undefined', undefined],
    ['an empty string', ''],
    ['only whitespace', '   '],
  ])('names the missing key when it is %s', (_case, value) => {
    expect(() => requireEnv(configWith(value), 'CLIENT_URL')).toThrow(
      'CLIENT_URL is missing in .env',
    );
  });
});
