'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GETRequest } from '@/lib/server/requests';
import { Conversation } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import { SquarePen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import HomeConversation from './HomeConversation';
import SearchConversation from './SearchConversation';

export default function HomeConversations() {
  const router = useRouter();
  const { session } = useAuth();

  const { data: conversations } = useQuery({
    enabled: !!session,
    queryKey: [session.user?.id, 'conversations'],
    queryFn: async () => {
      try {
        const { data, status, message } = await GETRequest<Conversation[]>('/v1/user/conversations');

        if (status !== 'OK') throw new Error(message);
        return data;
      } catch (error) {
        throw error;
      }
    },
    placeholderData: [],
  });

  const { data: conversationSearch } = useQuery<Conversation[]>({
    queryKey: ['conversation', 'search'],
  });

  const toDisplayConversation = useMemo(() => {
    let toDisplay: Conversation[] = [];

    if (conversationSearch) toDisplay = conversationSearch;
    else toDisplay = conversations!;

    return toDisplay;
  }, [conversations, conversationSearch]);
  return (
    <section className="h-full grid gap-2">
      <div className="flex items-center justify-between w-full mb-2">
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
      <SearchConversation />
      <ScrollArea className="h-[65dvh]">
        <div className="grid gap-1">
          {toDisplayConversation.map((convo) => (
            <HomeConversation key={convo.id} convo={convo} />
          ))}
        </div>
      </ScrollArea>
    </section>
  );
}
