'use client';
import useConversation from '@/components/hooks/queries/useConversation';
import { Button } from '@/components/ui/button';
import { isGroupChat } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import AddNickname from './customization/AddNickname';
import ChangeName from './customization/ChangeName';
import ChangePhoto from './customization/ChangePhoto';
export default function InfoCustomization() {
  const [isOpen, setIsOpen] = useState(false);

  const params = useParams<{ id: string }>();
  const { data: conversation } = useConversation(params.id);

  return (
    <Collapsible onOpenChange={(isOpen) => setIsOpen(isOpen)}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between font-semibold">
          <span>Customization</span>
          {isOpen ? <ChevronDown className="h-4 w-auto" /> : <ChevronRight className="h-4 w-auto" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 p-2">
        {conversation && isGroupChat(conversation) && (
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
