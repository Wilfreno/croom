import {
  hasLowerCase,
  hasMoreThanEightCharacters,
  hasMoreThanTwelveCharacters,
  hasNumber,
  hasSymbol,
  hasUpperCase,
} from './zod-checks.util';
const passwordStrengthPerfectScore = 100;

const criterias = {
  moreThan8: hasMoreThanEightCharacters,
  moreThan12: hasMoreThanTwelveCharacters,
  upperCase: hasUpperCase,
  lowerCase: hasLowerCase,
  number: hasNumber,
  symbol: hasSymbol,
};

const passwordCheckNumberOfCriterias = Object.keys(criterias).length;

export function passwordStrengthScorePerCriteriaSatisfied(criteriaSatisfied: number) {
  if (criteriaSatisfied > passwordCheckNumberOfCriterias)
    throw new Error(`criteria number must not be more than ${passwordCheckNumberOfCriterias}`);
  return Math.floor(
    ((criteriaSatisfied * (passwordStrengthPerfectScore / passwordCheckNumberOfCriterias)) /
      passwordStrengthPerfectScore) *
      100,
  );
}

export function getPasswordStrengthScore(password: string) {
  let score = 0;

  if (password && password.length < 8) return score;

  for (const [_, func] of Object.entries(criterias)) {
    if (func(password)) score++;
    else continue;
  }

  return Math.floor(score * (passwordStrengthPerfectScore / passwordCheckNumberOfCriterias));
}
