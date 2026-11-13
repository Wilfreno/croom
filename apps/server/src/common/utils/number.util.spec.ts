import { describe, expect, it } from 'vitest';
import { parsePositiveInteger } from './number.util';

describe('parsePositiveInteger', () => {
  it.each([
    ['1', 1],
    ['42', 42],
    [' 7 ', 7],
  ])('parses %j as %i', (value, expected) => {
    expect(parsePositiveInteger(value)).toBe(expected);
  });

  it.each([undefined, '', '0', '-1', '1.5', 'abc', 'Infinity', 'NaN'])('returns undefined for %j', (value) => {
    expect(parsePositiveInteger(value)).toBeUndefined();
  });
});
