import { useAuth } from '@/components/providers/AuthProvider';
import { axiosInstance } from '@/lib/axios-instance';
import { Conversation } from '@/types/model.types';
import { ServerResponse } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

export default function useActiveConversation() {
  const {
    session: { user },
  } = useAuth();

  const {
    data: activeConversations,
    isError,
    refetch,
    isRefetching,
    isLoading,
  } = useQuery({
    enabled: Boolean(user),
    queryKey: ['active', 'conversations', user?.id],
    queryFn: async () => {
      const { data: response } = await axiosInstance.get<ServerResponse<Conversation[]>>('/user/active-conversation');

      return response.data;
    },
    placeholderData: [],
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response && error.response.status < 500) return false;
      return failureCount < 3;
    },
  });
  return { activeConversations, refetch, isError, isRefetching, isLoading };
}
