import { axiosInstance } from '@/lib/axios-instance';
import { User } from '@/types/model.types';
import { ServerResponse } from '@repo/types';
import { useQuery } from '@tanstack/react-query';


export default function useSessionQuery() {
  const { data: user,  } = useQuery({
    queryKey: ['user', 'session'],
    async queryFn() {
      try {
        const { data: response } = await axiosInstance.get<ServerResponse<User>>('/auth/session');

        return response.data;
      } catch {
        return null;
      }
    },
    placeholderData: null,
  });
  return { user };
}
