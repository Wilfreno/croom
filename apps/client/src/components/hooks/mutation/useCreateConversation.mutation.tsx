import { axiosInstance } from '@/lib/axios-instance';
import { Conversation, Photo } from '@/types/model.types';
import { ServerResponse } from '@repo/types';
import { useMutation } from '@tanstack/react-query';
import useComposeMessage from './useComposeMessage.mutation';

export default function useCreateConversation({
  text,
  photos,
  conversationId,
  members,
}: {
  text: string;
  photos: Partial<Photo>[];
  conversationId: string;
  members: string[];
}) {
  const { sendMessage } = useComposeMessage({
    text,
    photos,
    conversationId,
  });

  const createNewConversation = useMutation({
    async mutationFn() {
      await axiosInstance.post<ServerResponse<Conversation>>('/conversation', {
        members,
      });
    },
    onSuccess() {
      sendMessage.mutate();
    },
  });
  return { createNewConversation };
}
