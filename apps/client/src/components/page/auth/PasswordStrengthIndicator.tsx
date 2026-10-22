import usePasswordStrengthChecker from '@/components/hooks/usePasswordStrengthChecker';
import { passwordStrengthScorePerCriteriaSatisfied } from '@repo/utils';
import { motion } from 'motion/react';
import { useMemo } from 'react';
export default function PasswordStrengthIndicator({ password }: { password: string }) {
  const { score, getStrengthColor } = usePasswordStrengthChecker(password);

  const message = useMemo(() => {
    if (!password.length) return '';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (score <= passwordStrengthScorePerCriteriaSatisfied(2)) return 'Password is very weak';
    else if (score <= passwordStrengthScorePerCriteriaSatisfied(4)) return 'Password is weak';
    else if (score === passwordStrengthScorePerCriteriaSatisfied(5)) return 'Password is strong';
    if (score === passwordStrengthScorePerCriteriaSatisfied(6)) return 'Password is very strong';
  }, [password, score]);

  return (
    <div className="grid gap-1">
      {score >= passwordStrengthScorePerCriteriaSatisfied(1) && (
        <div className="relative w-full h-2 rounded bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${score}%`,
              background: getStrengthColor(),
            }}
            className="absolute h-full rounded bg-slate-100 "
          ></motion.div>
        </div>
      )}
      <span
        data-testid="short-password-message"
        className="text-xs text-muted-foreground"
        style={{ color: getStrengthColor() }}
      >
        {message}
      </span>
    </div>
  );
}
