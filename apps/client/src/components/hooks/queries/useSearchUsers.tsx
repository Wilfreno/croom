import { axiosInstance } from '@/lib/axios-instance';
import { User } from '@repo/types';
import { ServerResponse } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import useDebounce from '../useDebounce';

export default function useSearchUsers(searchText: string) {
  const debouncedValue = useDebounce(searchText);

  const { data } = useQuery({
    enabled: Boolean(searchText),
    queryKey: ['search', 'user', debouncedValue],
    queryFn: async () => {
      const { data: response } = await axiosInstance.get<ServerResponse<User[]>>(`/user/search/${debouncedValue}`);

      return response.data;
    },
    placeholderData: [],
  });

  return { data };
}
