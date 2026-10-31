'use client';
import useConversation from '@/components/hooks/queries/useConversation';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { isGroupChat } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import Admins from './admin-and-members/Admins';
import Members from './admin-and-members/Members';

export default function InfoAdminsAndMembers() {
  const [isOpen, setIsOpen] = useState(false);

  const params = useParams<{ id: string }>();
  const { data: conversation } = useConversation(params.id);

  if (!conversation || !isGroupChat(conversation)) return null;

  return (
    <Collapsible onOpenChange={(isOpen) => setIsOpen(isOpen)}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between font-semibold">
          <span>Admins & Members</span>
          {isOpen ? <ChevronDown className="h-4 w-auto" /> : <ChevronRight className="h-4 w-auto" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 p-2">
        <Admins />
        <Members />
      </CollapsibleContent>
    </Collapsible>
  );
}
