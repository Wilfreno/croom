import { useAuth } from '@/components/providers/AuthProvider';
import { axiosInstance } from '@/lib/axios-instance';
import { getServerErrorMessage } from '@/lib/utils';
import type { Conversation, User } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function useManageMember(conversationId: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const queryKey = ['conversation', conversationId];

  function updateEverywhere(update: (conversation: Conversation) => Conversation) {
    const updateIfThisConversation = (conversation: Conversation) =>
      conversation.id === conversationId ? update(conversation) : conversation;

    queryClient.setQueryData<Conversation>(queryKey, (prev) => prev && update(prev));
    queryClient.setQueryData<Conversation[]>([session.user?.id, 'conversations'], (prev) =>
      prev?.map(updateIfThisConversation),
    );
    queryClient.setQueryData<Conversation[]>(['active', 'conversations', session.user?.id], (prev) =>
      prev?.map(updateIfThisConversation),
    );
  }

  function onError(error: Error) {
    toast.error(getServerErrorMessage(error));
    queryClient.invalidateQueries({ exact: true, queryKey });
  }

  const addMember = useMutation<void, Error, User>({
    async mutationFn(user) {
      await axiosInstance.post(`/conversation/${conversationId}/members`, { memberId: user.id });
    },
    onSuccess(_, user) {
      updateEverywhere((conversation) => {
        if (conversation.members.some((member) => member.id === user.id)) return conversation;

        return {
          ...conversation,
          members: [...conversation.members, user],
          nicknames: [...conversation.nicknames, { user: user.id, value: '' }],
        };
      });
    },
    onError,
  });

  const removeMember = useMutation<void, Error, string>({
    async mutationFn(memberId) {
      await axiosInstance.delete(`/conversation/${conversationId}/members/${memberId}`);
    },
    onSuccess(_, memberId) {
      updateEverywhere((conversation) => ({
        ...conversation,
        members: conversation.members.filter((member) => member.id !== memberId),
        admins: conversation.admins.filter((admin) => admin.id !== memberId),
        nicknames: conversation.nicknames.filter((nickname) => nickname.user !== memberId),
      }));
    },
    onError,
  });

  return { addMember, removeMember };
}
