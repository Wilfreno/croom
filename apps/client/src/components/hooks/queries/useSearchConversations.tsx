import { axiosInstance } from '@/lib/axios-instance';
import { Conversation } from '@/types/model.types';
import { ServerResponse } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import useDebounce from '../useDebounce';

export default function useSearchConversations(textSearch: string) {
  const debouncedValue = useDebounce(textSearch);

  const { data } = useQuery({
    enabled: Boolean(debouncedValue),
    queryKey: ['conversation', 'search', debouncedValue],
    async queryFn() {
      const { data: response } = await axiosInstance.get<ServerResponse<Conversation[]>>(
        `/conversation/search/${debouncedValue}`,
      );

      return response.data;
    },
  });
  return {
    data,
  };
}
