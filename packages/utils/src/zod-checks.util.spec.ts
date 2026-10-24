import { describe, expect, it } from 'vitest';
import {
  hasLowerCase,
  hasMoreThanEightCharacters,
  hasMoreThanTwelveCharacters,
  hasNumber,
  hasSymbol,
  hasUpperCase,
  isEmail,
} from './zod-checks.util';

describe('isEmail', () => {
  it.each([
    'someone@example.com',
    'first.last@example.co.uk',
    'user+tag@example.com',
  ])('accepts %s', (value) => {
    expect(isEmail(value)).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['no @', 'someone.example.com'],
    ['no domain', 'someone@'],
    ['no local part', '@example.com'],
    ['a bare word', 'someone'],
    ['inner whitespace', 'some one@example.com'],
  ])('rejects %s', (_case, value) => {
    expect(isEmail(value)).toBe(false);
  });
});

describe('length predicates', () => {
  it('treats the eight-character bound as inclusive', () => {
    expect(hasMoreThanEightCharacters('1234567')).toBe(false);
    expect(hasMoreThanEightCharacters('12345678')).toBe(true);
  });

  it('treats the twelve-character bound as inclusive', () => {
    expect(hasMoreThanTwelveCharacters('12345678901')).toBe(false);
    expect(hasMoreThanTwelveCharacters('123456789012')).toBe(true);
  });
});

describe('character-class predicates', () => {
  it('detects an upper-case letter', () => {
    expect(hasUpperCase('abc')).toBe(false);
    expect(hasUpperCase('abC')).toBe(true);
  });

  it('detects a lower-case letter', () => {
    expect(hasLowerCase('ABC')).toBe(false);
    expect(hasLowerCase('ABc')).toBe(true);
  });

  it('detects a digit', () => {
    expect(hasNumber('abc')).toBe(false);
    expect(hasNumber('abc1')).toBe(true);
  });

  it('detects a symbol', () => {
    expect(hasSymbol('abc123')).toBe(false);
    expect(hasSymbol('abc-123')).toBe(true);
  });

  it.each(['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', ' '])(
    'counts %s as a symbol',
    (char) => {
      expect(hasSymbol(char)).toBe(true);
    },
  );

  // A `/[^A-za-z0-9]/` range once spanned ASCII 65-122, so these six sat
  // inside it and were not counted as symbols at all.
  it.each(['[', '\\', ']', '^', '_', '`'])(
    'counts %s as a symbol despite sitting between Z and a in ASCII',
    (char) => {
      expect(hasSymbol(char)).toBe(true);
    },
  );

  it('does not mistake a letter or digit for a symbol', () => {
    for (const char of 'aZ0') expect(hasSymbol(char)).toBe(false);
  });
});
