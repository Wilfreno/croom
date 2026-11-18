import { useAuth } from '@/components/providers/AuthProvider';
import { axiosInstance } from '@/lib/axios-instance';
import { getServerErrorMessage } from '@/lib/utils';
import { Conversation, ServerResponse } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function useCreateConversation() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const createConversation = useMutation<Conversation, Error, string[]>({
    async mutationFn(memberIds) {
      const { data: response } = await axiosInstance.post<ServerResponse<Conversation>>('/conversation', {
        members: memberIds,
      });

      return response.data;
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [session.user?.id, 'conversations'] });
    },
    onError(error) {
      toast.error(getServerErrorMessage(error));
    },
  });
  return { createConversation };
}
