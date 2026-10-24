import usePasswordStrengthChecker from '@/components/hooks/usePasswordStrengthChecker';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const scoreOf = (password: string) =>
  renderHook(() => usePasswordStrengthChecker(password)).result.current.score;

describe('usePasswordStrengthChecker', () => {
  it('scores an empty password at zero', () => {
    expect(scoreOf('')).toBe(0);
  });

  it('scores anything under eight characters at zero, however varied', () => {
    // a short password cannot buy its way up with character classes
    expect(scoreOf('aB1!')).toBe(0);
    expect(scoreOf('aB1!aB')).toBe(0);
  });

  it('climbs as criteria are met', () => {
    const lower = scoreOf('aaaaaaaa');
    const withUpper = scoreOf('aaaaaaaA');
    const withNumber = scoreOf('aaaaaaA1');
    const withSymbol = scoreOf('aaaaaA1!');

    expect(lower).toBeLessThan(withUpper);
    expect(withUpper).toBeLessThan(withNumber);
    expect(withNumber).toBeLessThan(withSymbol);
  });

  it('reaches a perfect score only when every criterion is met', () => {
    // twelve characters, upper, lower, number and symbol
    expect(scoreOf('aaaaaaaaaaaA1!')).toBe(100);
  });

  it('stops short of perfect when the password is merely long enough', () => {
    expect(scoreOf('aaaaaaaaaaaaa')).toBeLessThan(100);
  });

  it('counts a symbol that sits between Z and a in ASCII', () => {
    // `_` was once swallowed by an `A-z` range in the underlying checker
    expect(scoreOf('aaaaaaaA1_')).toBe(scoreOf('aaaaaaaA1!'));
  });

  describe('scorePerCriteriaSatisfied', () => {
    it('spreads the six criteria evenly across a hundred', () => {
      const { result } = renderHook(() => usePasswordStrengthChecker('aaaaaaaa'));

      expect(result.current.scorePerCriteriaSatisfied(1)).toBe(16);
      expect(result.current.scorePerCriteriaSatisfied(3)).toBe(50);
      expect(result.current.scorePerCriteriaSatisfied(6)).toBe(100);
    });

    it('lines up with the score a password of that many criteria earns', () => {
      const { result } = renderHook(() => usePasswordStrengthChecker('aaaaaaaa'));
      const { scorePerCriteriaSatisfied } = result.current;

      // lower + eight characters = two criteria
      expect(scoreOf('aaaaaaaa')).toBe(scorePerCriteriaSatisfied(2));
      // lower + upper + number + eight characters = four
      expect(scoreOf('aaaaaaA1')).toBe(scorePerCriteriaSatisfied(4));
    });
  });

  describe('getStrengthColor', () => {
    const colorOf = (password: string) =>
      renderHook(() => usePasswordStrengthChecker(password)).result.current.getStrengthColor();

    it('gives a short password the weakest colour', () => {
      expect(colorOf('aB1!')).toBe(colorOf('a'));
    });

    it('changes colour as the score climbs', () => {
      expect(colorOf('aaaaaaaa')).not.toBe(colorOf('aaaaaA1!'));
    });

    it('gives a perfect password its own colour', () => {
      expect(colorOf('aaaaaaaaaaaA1!')).toBe('oklch(72.3% 0.219 149.579)');
    });
  });
});
