'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { GETRequest } from '@/lib/server/requests';
import { Conversation, Message } from '@repo/types';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import ConversationMessage from '../conversation/ConversationMessage';

export default function ComposeFoundMessages() {
  const { session } = useAuth();

  const { data: selectedUsers } = useQuery<string[][]>({
    queryKey: ['compose', 'selected_users'],
    placeholderData: [],
  });

  const { data: foundConversation, isError } = useQuery<Conversation[]>({
    enabled: !!selectedUsers?.length && !!session.user,
    queryKey: ['conversation', 'members', selectedUsers],
    placeholderData: [],
  });

  const { data: foundMessages } = useInfiniteQuery<{
    pageParam: number;
    result: Message[];
  }>({
    enabled: !!foundConversation && foundConversation.length === 1,
    queryKey: ['conversation', 'messages', foundConversation?.[0]?.id],
    queryFn: async ({ pageParam }) => {
      try {
        const page = pageParam as number;
        const {
          data: result,
          status,
          message,
        } = await GETRequest<Message[]>(
          '/v1/conversation/' + foundConversation?.[0].id + '/messages?page=' + page,
        );

        if (status !== 'OK') throw new Error(message);

        return { pageParam: page, result };
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.result.length) return lastPage.pageParam + 1;
      return undefined;
    },
    placeholderData: { pages: [], pageParams: [] },
  });

  return (
    <div className="h-full w-full max-h-[80dvh] flex flex-col px-1 overflow-y-auto scrollbar scrollbar-thumb-gray-300  scrollbar-track-background">
      <div className="mt-auto space-y-px">
        {!!foundMessages?.pages.length &&
          !isError &&
          foundMessages.pages.map((page, pagesIndex) =>
            page.result.map((message, messageIndex) => (
              <ConversationMessage
                key={message.id}
                message={message}
                prevMessage={page.result[messageIndex - 1]}
                nextMessage={page.result[messageIndex + 1]}
                isLastMessage={
                  pagesIndex === foundMessages.pages.length - 1 && messageIndex === page.result.length - 1
                }
              />
            )),
          )}
      </div>
    </div>
  );
}
