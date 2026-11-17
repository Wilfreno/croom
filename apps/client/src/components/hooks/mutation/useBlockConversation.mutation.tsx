import { useAuth } from '@/components/providers/AuthProvider';
import { axiosInstance } from '@/lib/axios-instance';
import { Block } from '@/types/block.types';
import { SOMETHING_WENT_WRONG, USER_BLOCKED, USER_UNBLOCKED } from '@repo/constants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';


export default function useBlockConversation() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session.user?.id;

  async function refresh(conversationId: string, { skipBlockedList = false } = {}) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] }),
      queryClient.invalidateQueries({ queryKey: [userId, 'conversations'] }),
      queryClient.invalidateQueries({ queryKey: ['active', 'conversations', userId] }),
      !skipBlockedList && queryClient.invalidateQueries({ queryKey: [userId, 'blocked'] }),
    ]);
  }

  const blockConversation = useMutation<void, Error, string>({
    async mutationFn(conversationId) {
      await axiosInstance.post(`/conversation/${conversationId}/block`);
    },
    async onSuccess(_, conversationId) {
      toast(USER_BLOCKED);
      await refresh(conversationId);
    },
    onError() {
      toast.error(SOMETHING_WENT_WRONG);
    },
  });

  const unblockConversation = useMutation<void, Error, string>({
    async mutationFn(conversationId) {
      await axiosInstance.delete(`/conversation/${conversationId}/block`);
    },
    async onSuccess(_, conversationId) {
      toast(USER_UNBLOCKED);
      queryClient.setQueryData<Block[]>([userId, 'blocked'], (prev) =>
        prev?.filter((block) => block.id !== conversationId),
      );
      await refresh(conversationId, { skipBlockedList: true });
    },
    onError() {
      toast.error(SOMETHING_WENT_WRONG);
    },
  });

  return { blockConversation, unblockConversation };
}
