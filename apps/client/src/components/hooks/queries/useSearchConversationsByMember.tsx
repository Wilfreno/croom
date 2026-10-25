import { useAuth } from '@/components/providers/AuthProvider';
import { axiosInstance } from '@/lib/axios-instance';
import { Conversation } from '@/types/model.types';
import { ServerResponse } from '@repo/types';
import { useQuery } from '@tanstack/react-query';

export default function useSearchConversationsByMembers(selectedUsers: string[][] = []) {
  const {
    session: { user },
  } = useAuth();

  const { data: foundConversations, isError } = useQuery({
    enabled: Boolean(selectedUsers?.length) && Boolean(user),
    queryKey: ['conversation', 'members', selectedUsers],
    queryFn: async () => {
      try {
        const { data: response } = await axiosInstance.get<ServerResponse<Conversation[]>>(
          '/v1/conversation?members=' + selectedUsers.map((users) => users[0]).join(','),
        );

        return response.data;
      } catch (error) {
        throw error;
      }
    },
    placeholderData: [],
  });
  return {
    foundConversations,
    isError,
  };
}
