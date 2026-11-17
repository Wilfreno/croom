'use client';
import useCallParticipants from '@/components/hooks/useCallParticipants';
import { useCallSidePanel } from '@/components/providers/CallSidePanelProvider';
import { Button } from '@/components/ui/button';
import { peopleLabel } from '@/lib/utils';
import { Users } from 'lucide-react';

export default function ParticipantsButton() {
  const { openPanel, togglePanel } = useCallSidePanel();
  const { participants } = useCallParticipants();
  const peopleCount = participants.length + 1;
  const isOpen = openPanel === 'participants';

  return (
    <Button
      variant="ghost"
      className="relative rounded-full text-white"
      aria-label={`${isOpen ? 'Hide' : 'Show'} ${peopleLabel(peopleCount)}`}
      aria-expanded={isOpen}
      onClick={() => togglePanel('participants')}
    >
      <Users />
      <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
        {peopleCount}
      </span>
    </Button>
  );
}
