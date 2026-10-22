import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Asterisk } from 'lucide-react';

export default function PasswordToolTip({ open }: { open: boolean }) {
  return (
    <TooltipProvider>
      <Tooltip open={open}>
        <TooltipTrigger type="button" className="aspect-square h-3 p-0 my-1">
          <Asterisk className="h-full w-full" />
        </TooltipTrigger>
        <TooltipContent align="start">
          <p>Password must satisfy some of the following:</p>
          <ul className="list-disc pl-4">
            <li>Must be at least 8 characters</li>
            <li>Has uppercase letters</li>
            <li>Has numbers</li>
            <li>Has symbols e.g. !@#$%^&amp;*()_+-=[]{}|;:',.&lt;&gt;/?`~"\</li>
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
