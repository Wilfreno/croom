'use client';
import { Button, ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CallControlTone } from '@/types/call.types';

const toneClasses: Record<CallControlTone, string> = {
  neutral: 'bg-white/10 text-white hover:bg-white/20 hover:text-white',
  active: 'bg-white text-slate-900 hover:bg-white/90 hover:text-slate-900',
  off: 'bg-red-500 text-white hover:bg-red-500/90 hover:text-white',
  danger: 'w-14 bg-red-600 text-white hover:bg-red-700 hover:text-white sm:w-16',
};

export default function CallControlButton({
  label,
  tone = 'neutral',
  className,
  children,
  ...props
}: Omit<ButtonProps, 'variant' | 'size'> & { label: string; tone?: CallControlTone }) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            aria-label={label}
            className={cn(
              'relative h-11 w-11 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-white/70 [&_svg]:h-5 [&_svg]:w-5',
              toneClasses[tone],
              className,
            )}
            {...props}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={10}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
