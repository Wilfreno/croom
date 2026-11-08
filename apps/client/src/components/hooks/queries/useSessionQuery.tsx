import { axiosInstance } from '@/lib/axios-instance';
import { UserSession } from '@/types/model.types';
import { ServerResponse } from '@repo/types';
import { useQuery } from '@tanstack/react-query';

export default function useSessionQuery() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', 'session'],
    async queryFn() {
      try {
        const { data: response } = await axiosInstance.get<ServerResponse<UserSession>>('/auth/session');

        return response.data;
      } catch {
        return null;
      }
    },
  });
  return { user, isLoading };
}
