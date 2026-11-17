import { describe, expect, it } from 'vitest';
import { isGroupChat } from './conversation.util';

describe('isGroupChat', () => {
  it.each([
    [0, false],
    [1, false],
    [2, false],
    [3, true],
    [10, true],
  ])('with %i members is %s', (count, expected) => {
    expect(isGroupChat(Array.from({ length: count }))).toBe(expected);
  });
});
