import { axiosInstance } from '@/lib/axios-instance';
import { Conversation, ServerResponse } from '@repo/types';
import { useQuery } from '@tanstack/react-query';

export default function useConversation(id?: string) {
  const { data, isError, error, refetch } = useQuery({
    enabled: Boolean(id),
    queryKey: ['conversation', id],
    async queryFn() {
      const { data: response } = await axiosInstance.get<ServerResponse<Conversation>>(`/conversation/${id}`);

      return response.data;
    },
  });
  return { data, isError, error, refetch };
}
