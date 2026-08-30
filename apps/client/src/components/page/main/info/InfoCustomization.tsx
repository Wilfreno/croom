'use client';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getConvoOptions } from '@/lib/react-query/prefetch-query-options';
import { Conversation } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import AddNickname from './customization/AddNickname';
import ChangeName from './customization/ChangeName';
import ChangePhoto from './customization/ChangePhoto';
export default function InfoCustomization() {
  const [isOpen, setIsOpen] = useState(false);

  const params = useParams<{ id: string }>();
  const { data: conversation } = useQuery(getConvoOptions(params.id));
  return (
    <Collapsible onOpenChange={(isOpen) => setIsOpen(isOpen)}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between font-semibold">
          <span>Customization</span>
          {isOpen ? <ChevronDown className="h-4 w-auto" /> : <ChevronRight className="h-4 w-auto" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 p-2">
        {(conversation?.data as Conversation).isGroupChat && (
          <>
            <ChangePhoto />
            <ChangeName />
          </>
        )}
        <AddNickname />
      </CollapsibleContent>
    </Collapsible>
  );
}
