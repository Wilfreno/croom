import { AvatarFallback } from '@/components/ui/avatar';
import { cn, getAvatarColor, getInitials } from '@/lib/utils';
import { UserRound } from 'lucide-react';

export default function InitialsFallback({
  name,
  colorKey,
  className,
}: {
  name?: string;
  colorKey?: string;
  className?: string;
}) {
  const initials = name ? getInitials(name) : '';

  if (!initials)
    return (
      <AvatarFallback className={cn('bg-background', className)}>
        <UserRound className="h-1/2 w-auto" />
      </AvatarFallback>
    );

  return (
    <AvatarFallback
      className={cn('text-white', className)}
      style={{ backgroundColor: getAvatarColor(colorKey || name!) }}
    >
      <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill="currentColor"
          fontSize="15"
          fontWeight="600"
        >
          {initials}
        </text>
      </svg>
    </AvatarFallback>
  );
}
