'use client';
import useConversations from '@/components/hooks/queries/useConversations';
import useSearchConversations from '@/components/hooks/queries/useSearchConversations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Conversation } from '@repo/types';
import { Search, SquarePen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import HomeConversation from './HomeConversation';

export default function HomeConversations() {
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const { conversations } = useConversations();
  const { data: conversationSearch } = useSearchConversations(searchText);

  const conversationToDisplay = useMemo(() => {
    let toDisplay: Conversation[] = [];

    if (conversationSearch) toDisplay = conversationSearch;
    else toDisplay = conversations!;

    return toDisplay;
  }, [conversations, conversationSearch]);

  return (
    <section className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between w-full px-4">
        <p className="font-bold hidden md:block">Conversations</p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="aspect-square h-fit w-auto rounded-full p-2 hidden md:inline-flex"
                onClick={() => router.push('/compose')}
              >
                <SquarePen className="h-4 w-auto" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Compose</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="relative flex items-center px-2">
        <Label htmlFor="search" className="absolute top-1/2 left-4 -translate-y-1/2">
          <Search className="h-5" />
        </Label>
        <Input
          autoComplete="off"
          placeholder="Search"
          id="search"
          className="pl-8"
          value={searchText}
          onChange={(e) => setSearchText(e.currentTarget.value)}
        />
      </div>
      <ScrollArea className="h-[60dvh]">
        <div className="grid gap-1">
          {conversationToDisplay?.map((conversation) => (
            <HomeConversation key={conversation.id} conversation={conversation} />
          ))}
        </div>
      </ScrollArea>
    </section>
  );
}
