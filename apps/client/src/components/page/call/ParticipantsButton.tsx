'use client';
import useCallParticipants from '@/components/hooks/useCallParticipants';
import { useParticipantsPanel } from '@/components/providers/ParticipantsPanelProvider';
import { Button } from '@/components/ui/button';
import { peopleLabel } from '@/lib/utils';
import { Users } from 'lucide-react';

export default function ParticipantsButton() {
  const { isOpen, setIsOpen } = useParticipantsPanel();
  const { participants } = useCallParticipants();
  const peopleCount = participants.length + 1;

  return (
    <div className="absolute bottom-24 right-4 p-2 sm:bottom-10">
      <Button
        variant="ghost"
        className="relative rounded-full text-white"
        aria-label={`${isOpen ? 'Hide' : 'Show'} ${peopleLabel(peopleCount)}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Users />
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
          {peopleCount}
        </span>
      </Button>
    </div>
  );
}
