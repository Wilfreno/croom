import { axiosInstance } from '@/lib/axios-instance';
import { Message, Photo, ServerResponse } from '@repo/types';
import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export default function useComposeMessage({
  text,
  photos,
  conversationId,
}: {
  text: string;
  photos: Partial<Photo>[];
  conversationId: string;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const sendMessage = useMutation<Message>({
    mutationFn: async () => {
      const { data: response } = await axiosInstance.post<ServerResponse<Message>>('/message', {
        conversationId,
        text,
        photos,
      });

      return response.data;
    },
    onSuccess: async (newMessage) => {
      queryClient.setQueryData<
        | InfiniteData<
            {
              pageParam: number;
              result: Message[];
            },
            unknown
          >
        | undefined
      >(['conversation', 'messages', conversationId], (prev) => {
        if (!prev) return;

        return {
          ...prev,
          pages: prev.pages.map(({ pageParam, result }, index) => ({
            pageParam,
            result: index === prev.pages.length - 1 ? [...result, newMessage] : result,
          })),
        };
      });
      router.push('/conversation/' + conversationId);
    },
  });
  return {
    sendMessage,
  };
}
