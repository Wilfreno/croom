import { useAuth } from '@/components/providers/AuthProvider';
import { axiosInstance } from '@/lib/axios-instance';
import { SOMETHING_WENT_WRONG } from '@repo/constants';
import { Conversation, ServerResponse } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

export default function useConversations() {
  const {
    session: { user },
  } = useAuth();

  const { data: conversations, isError } = useQuery<unknown, AxiosError, Conversation[]>({
    enabled: Boolean(user),
    queryKey: [user?.id, 'conversations'],
    queryFn: async () => {
      const { data: response } = await axiosInstance.get<ServerResponse<Conversation>>('/user/conversations');
      return response.data;
    },
    placeholderData: [],
  });

  if (isError) toast.error(SOMETHING_WENT_WRONG);
  return { conversations };
}
