import { describe, expect, it } from 'vitest';
import { describeOnlyAdminGroups } from './only-admin-groups.util';

describe('describeOnlyAdminGroups', () => {
  it.each([
    [
      ['Book club'],
      'make another member an admin of "Book club" before deleting your account',
    ],
    [
      ['Book club', 'Hiking'],
      'make another member an admin of "Book club", "Hiking" before deleting your account',
    ],
    [
      [''],
      'make another member an admin of 1 unnamed group before deleting your account',
    ],
    [
      ['Book club', '', ''],
      'make another member an admin of "Book club", 2 unnamed groups before deleting your account',
    ],
  ])('describes %j', (groupNames, expected) => {
    expect(describeOnlyAdminGroups(groupNames)).toBe(expected);
  });
});
