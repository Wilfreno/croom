import { describe, expect, it } from 'vitest';
import { hasGroupMemberCount } from './conversation.util';

describe('hasGroupMemberCount', () => {
  it.each([
    [0, false],
    [1, false],
    [2, false],
    [3, true],
    [10, true],
  ])('with %i members is %s', (count, expected) => {
    expect(hasGroupMemberCount(Array.from({ length: count }))).toBe(expected);
  });
});
