import { useAuth } from '@/components/providers/AuthProvider';
import { axiosInstance } from '@/lib/axios-instance';
import { Block } from '@/types/block.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Block and unblock a one-to-one conversation. Both refresh every cached view
 * that depends on the block: the conversation itself, the conversation lists
 * and the blocked-users list in settings.
 */
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
    onSuccess: (_, conversationId) => refresh(conversationId),
  });

  const unblockConversation = useMutation<void, Error, string>({
    async mutationFn(conversationId) {
      await axiosInstance.delete(`/conversation/${conversationId}/block`);
    },
    async onSuccess(_, conversationId) {
      queryClient.setQueryData<Block[]>([userId, 'blocked'], (prev) =>
        prev?.filter((block) => block.id !== conversationId),
      );
      await refresh(conversationId, { skipBlockedList: true });
    },
  });

  return { blockConversation, unblockConversation };
}
