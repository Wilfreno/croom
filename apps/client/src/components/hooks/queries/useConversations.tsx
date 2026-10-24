import { useAuth } from '@/components/providers/AuthProvider';
import { axiosInstance } from '@/lib/axios-instance';
import { Conversation } from '@/types/model.types';
import { SOMETHING_WENT_WRONG } from '@repo/constants';
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
      const { data: response } = await axiosInstance.get('/user/conversations');
      return response;
    },
    placeholderData: [],
  });

  if (isError) toast.error(SOMETHING_WENT_WRONG);
  return { conversations };
}
