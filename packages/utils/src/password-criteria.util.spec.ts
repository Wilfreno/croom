import { describe, expect, it } from 'vitest';
import { getPasswordStrengthScore, passwordStrengthScorePerCriteriaSatisfied } from './password-criteria.util';

describe('passwordStrengthScorePerCriteriaSatisfied', () => {
  it.each([
    [0, 0],
    [1, 16],
    [2, 33],
    [3, 50],
    [4, 66],
    [5, 83],
    [6, 100],
  ])('scores %i satisfied criteria as %i', (criteria, score) => {
    expect(passwordStrengthScorePerCriteriaSatisfied(criteria)).toBe(score);
  });

  it('rejects more criteria than exist', () => {
    expect(() => passwordStrengthScorePerCriteriaSatisfied(7)).toThrow(/must not be more than 6/);
  });
});

describe('getPasswordStrengthScore', () => {
  it('scores a password shorter than eight characters as 0, whatever it contains', () => {
    expect(getPasswordStrengthScore('Aa1!')).toBe(0);
  });

  it('scores an empty password as 0', () => {
    expect(getPasswordStrengthScore('')).toBe(0);
  });

  it('counts length and lowercase for eight lowercase letters', () => {
    expect(getPasswordStrengthScore('aaaaaaaa')).toBe(passwordStrengthScorePerCriteriaSatisfied(2));
  });

  it('adds one criterion each for uppercase, number and symbol', () => {
    expect(getPasswordStrengthScore('aaaaaaaA')).toBe(passwordStrengthScorePerCriteriaSatisfied(3));
    expect(getPasswordStrengthScore('aaaaaaA1')).toBe(passwordStrengthScorePerCriteriaSatisfied(4));
    expect(getPasswordStrengthScore('aaaaaA1!')).toBe(passwordStrengthScorePerCriteriaSatisfied(5));
  });

  it('counts twelve or more characters as an extra criterion', () => {
    expect(getPasswordStrengthScore('aaaaaaaaaaaa')).toBe(passwordStrengthScorePerCriteriaSatisfied(3));
  });

  it('gives a password meeting every criterion a perfect score', () => {
    expect(getPasswordStrengthScore('Abcdefgh1!xy')).toBe(100);
  });

  it('treats a space as a symbol', () => {
    expect(getPasswordStrengthScore('aaaaaaa ')).toBe(passwordStrengthScorePerCriteriaSatisfied(3));
  });
});
