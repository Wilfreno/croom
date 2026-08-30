'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { getConvoOptions } from '@/lib/react-query/prefetch-query-options';
import { GETRequest } from '@/lib/server/requests';
import { Message } from '@repo/types';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import ConversationMessage from './ConversationMessage';

export default function ConversationMessages() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();

  const { data: queryResponse } = useQuery(getConvoOptions(params.id));
  const { data: foundMessages } = useInfiniteQuery<{
    pageParam: number;
    result: Message[];
  }>({
    enabled: !!queryResponse && !!session.user,
    queryKey: ['conversation', 'messages', params.id],
    queryFn: async ({ pageParam }) => {
      try {
        const page = pageParam as number;
        const {
          data: result,
          status,
          message,
        } = await GETRequest<Message[]>('/v1/conversation/' + params.id + '/messages?page=' + page);

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
