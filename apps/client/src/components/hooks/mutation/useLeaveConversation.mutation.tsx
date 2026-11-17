import { useAuth } from '@/components/providers/AuthProvider';
import { axiosInstance } from '@/lib/axios-instance';
import { getServerErrorMessage } from '@/lib/utils';
import { LEFT_GROUP_CHAT } from '@repo/constants';
import type { Conversation } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function useLeaveConversation() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const userId = session.user?.id;

  return useMutation<void, Error, string>({
    async mutationFn(conversationId) {
      await axiosInstance.post(`/conversation/${conversationId}/leave`);
    },
    async onSuccess(_, conversationId) {
      toast(LEFT_GROUP_CHAT);
      queryClient.setQueryData<Conversation[]>([userId, 'conversations'], (prev) =>
        prev?.filter((conversation) => conversation.id !== conversationId),
      );
      router.push('/');
      queryClient.removeQueries({ exact: true, queryKey: ['conversation', conversationId] });
      await queryClient.invalidateQueries({ queryKey: ['active', 'conversations', userId] });
    },
    async onError(error, conversationId) {
      toast.error(getServerErrorMessage(error));
      await queryClient.invalidateQueries({ exact: true, queryKey: ['conversation', conversationId] });
    },
  });
}
