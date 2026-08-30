import usePasswordStrengthChecker from '@/components/hooks/usePasswordStrengthChecker';
import { motion } from 'motion/react';
import { useMemo } from 'react';
export default function SignUpPasswordStrength({ password }: { password: string }) {
  const { score, scorePerCriteriaSatisfied, getStrengthColor } = usePasswordStrengthChecker(password);

  const message = useMemo(() => {
    if (!password.length) return '';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (score <= scorePerCriteriaSatisfied(2)) return 'Password is very weak';
    else if (score <= scorePerCriteriaSatisfied(4)) return 'Password is weak';
    else if (score === scorePerCriteriaSatisfied(5)) return 'Password is strong';
    if (score === scorePerCriteriaSatisfied(6)) return 'Password is very strong';
  }, [password, score]);

  return (
    <div className="grid gap-1">
      {score >= scorePerCriteriaSatisfied(1) && (
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
