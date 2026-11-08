import { axiosInstance } from '@/lib/axios-instance';
import { CheckUserDataType, EmailStatus } from '@repo/enums';
import { useQuery } from '@tanstack/react-query';
import useDebounce from '../useDebounce';

export default function useEmailCheck(email: string) {
  const debouncedEmailValue = useDebounce(email, 1000);

  const { data, isLoading } = useQuery<EmailStatus>({
    enabled: Boolean(debouncedEmailValue),
    queryKey: ['signup', 'form', 'email', 'check', debouncedEmailValue],
    async queryFn() {
      const { data } = await axiosInstance.get(`/user/check/${CheckUserDataType.EMAIL}/${debouncedEmailValue}`);
      return data.data;
    },
  });

  return {
    data,
    isLoading,
  };
}
