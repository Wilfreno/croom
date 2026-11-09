import useUserAgent from '@/components/hooks/useUserAgent';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function useInfoSidebarOpen() {
  const { onMobile } = useUserAgent();
  const queryClient = useQueryClient();
  const queryKey = ['sidebar', 'info', 'open', onMobile];

  const { data: isOpen } = useQuery({
    queryKey,
    queryFn: () => !onMobile,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  function setIsOpen(value: boolean | ((prev: boolean | undefined) => boolean)) {
    queryClient.setQueryData<boolean>(queryKey, value);
  }

  return { isOpen: Boolean(isOpen), setIsOpen, onMobile };
}
