import { axiosInstance } from '@/lib/axios-instance';
import { Conversation, Message } from '@/types/model.types';
import { ServerResponse } from '@repo/types';
import { useInfiniteQuery } from '@tanstack/react-query';

export default function useMessages(foundConversation: Conversation[]) {
  const { data: foundMessages, isError } = useInfiniteQuery<{
    pageParam: number;
    result: Message[];
  }>({
    enabled: Boolean(foundConversation) && Boolean(foundConversation![0]) && foundConversation!.length === 1,
    queryKey: ['conversation', 'messages', foundConversation?.[0]?._id],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      const { data: response } = await axiosInstance.get<ServerResponse<Message[]>>(
        '/conversation/' + foundConversation?.[0]._id + '/messages?page=' + page,
      );

      return { pageParam: page, result: response.data };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.result.length) return lastPage.pageParam + 1;
      return undefined;
    },
    placeholderData: { pages: [], pageParams: [] },
  });
  return { foundMessages, isError };
}
