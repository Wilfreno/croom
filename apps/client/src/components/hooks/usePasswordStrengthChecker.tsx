import {
  hasLowerCase,
  hasMoreThanEightCharacters,
  hasMoreThanTwelveCharacters,
  hasNumber,
  hasSymbol,
  hasUpperCase,
} from '@repo/utils';
import { useMemo } from 'react';

export default function usePasswordStrengthChecker(password: string) {
  const perfectScore = 100;
  const criterias = useMemo(() => {
    return {
      moreThan8: hasMoreThanEightCharacters(password),
      moreThan12: hasMoreThanTwelveCharacters(password),
      upperCase: hasUpperCase(password),
      lowerCase: hasLowerCase(password),
      number: hasNumber(password),
      symbol: hasSymbol(password),
    };
  }, [password]);

  const { score, numberOfCriterias } = useMemo(() => {
    let score = 0;
    const numberOfCriterias = Object.keys(criterias).length;

    if (password && password.length < 8) return { score, numberOfCriterias };

    for (const [_, value] of Object.entries(criterias)) {
      if (value) score++;
      else continue;
    }
    return { score: Math.floor(score * (perfectScore / numberOfCriterias)), numberOfCriterias };
  }, [password]);

  function scorePerCriteriaSatisfied(criteriaSatisfied: number) {
    return Math.floor(((criteriaSatisfied * (perfectScore / numberOfCriterias)) / perfectScore) * 100);
  }

  function getStrengthColor() {
    if (score === scorePerCriteriaSatisfied(1) || password.length < 8) return 'oklch(63.7% 0.237 25.331)';
    if (score === scorePerCriteriaSatisfied(2)) return 'oklch(70.5% 0.213 47.604)';
    if (score === scorePerCriteriaSatisfied(3)) return 'oklch(76.9% 0.188 70.08)';
    if (score === scorePerCriteriaSatisfied(4)) return 'oklch(79.5% 0.184 86.047)';
    if (score === scorePerCriteriaSatisfied(5)) return 'oklch(76.8% 0.233 130.85)';
    if (score === scorePerCriteriaSatisfied(6)) return 'oklch(72.3% 0.219 149.579)';
  }
  return { score, scorePerCriteriaSatisfied, getStrengthColor };
}
