import { getPasswordStrengthScore, passwordStrengthScorePerCriteriaSatisfied } from '@repo/utils';
import { useMemo } from 'react';

export default function usePasswordStrengthChecker(password: string) {
  const score = useMemo(() => {
    return getPasswordStrengthScore(password);
  }, [password]);

  function getStrengthColor() {
    if (score === passwordStrengthScorePerCriteriaSatisfied(1) || password.length < 8)
      return 'oklch(63.7% 0.237 25.331)';
    if (score === passwordStrengthScorePerCriteriaSatisfied(2)) return 'oklch(70.5% 0.213 47.604)';
    if (score === passwordStrengthScorePerCriteriaSatisfied(3)) return 'oklch(76.9% 0.188 70.08)';
    if (score === passwordStrengthScorePerCriteriaSatisfied(4)) return 'oklch(79.5% 0.184 86.047)';
    if (score === passwordStrengthScorePerCriteriaSatisfied(5)) return 'oklch(76.8% 0.233 130.85)';
    if (score === passwordStrengthScorePerCriteriaSatisfied(6)) return 'oklch(72.3% 0.219 149.579)';
  }

  return { score, getStrengthColor };
}
