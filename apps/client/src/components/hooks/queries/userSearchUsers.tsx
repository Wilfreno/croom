import { axiosInstance } from '@/lib/axios-instance';
import { User } from '@/types/model.types';
import { ServerResponse } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import useDebounce from '../useDebounce';

export default function userSearchUsers(searchText: string) {
  const debouncedValue = useDebounce(searchText);

  const { data } = useQuery({
    enabled: Boolean(searchText),
    queryKey: ['search', 'user', debouncedValue],
    queryFn: async () => {
      const { data: response } = await axiosInstance.get<ServerResponse<User[]>>(`/v1/user/search/${debouncedValue}`);

      return response.data;
    },
    placeholderData: [],
  });

  return { data };
}
