'use client';
import ComposeFoundMessages from '@/components/page/main/compose/ComposeFoundMessages';
import ComposeMessageInput from '@/components/page/main/compose/ComposeMessageInput';
import ComposeTo from '@/components/page/main/compose/ComposeTo';
import MainContent from '@/components/page/main/MainContent';
import { COMPOSE_SELECTED_USERS_QUERY_KEY } from '@repo/constants';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export default function Page() {
  const queryClient = useQueryClient();
  // Other screens (e.g. "Message" on a user's profile) can pre-select recipients through the query cache.
  const [selectedUsers, setSelectedUsers] = useState<string[][]>(
    () => queryClient.getQueryData<string[][]>(COMPOSE_SELECTED_USERS_QUERY_KEY) ?? [],
  );

  // Consume the hand-off once, so a later visit to /compose starts empty.
  useEffect(() => {
    queryClient.removeQueries({ queryKey: COMPOSE_SELECTED_USERS_QUERY_KEY, exact: true });
  }, [queryClient]);

  return (
    <MainContent className="grid grid-rows-[auto_1fr_auto]">
      <ComposeTo selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} />
      <ComposeFoundMessages selectedUsers={selectedUsers} />
      <ComposeMessageInput selectedUsers={selectedUsers} />
    </MainContent>
  );
}
