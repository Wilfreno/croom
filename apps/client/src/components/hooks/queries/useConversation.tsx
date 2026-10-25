import { axiosInstance } from '@/lib/axios-instance';
import { Conversation } from '@/types/model.types';
import { ServerResponse } from '@repo/types';
import { useQuery } from '@tanstack/react-query';

export default function useConversation(id?: string) {
  const { data } = useQuery({
    enabled: Boolean(id),
    queryKey: ['conversation', id],
    async queryFn() {
      const { data: response } = await axiosInstance.get<ServerResponse<Conversation>>(`/v1/conversation/${id}`);

      return response.data;
    },
  });
  return { data };
}
