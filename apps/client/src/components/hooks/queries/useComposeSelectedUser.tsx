import { useQuery } from '@tanstack/react-query';

export default function useComposeSelectedUser(selectedUsers: string[][] = []) {
  const { data } = useQuery({
    queryKey: ['compose', 'selected', 'user'],
    queryFn: () => selectedUsers,
    placeholderData: [],
  });
  return { data };
}
