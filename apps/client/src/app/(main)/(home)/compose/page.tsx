'use client';
import ComposeFoundMessages from '@/components/page/main/compose/ComposeFoundMessages';
import ComposeMessageInput from '@/components/page/main/compose/ComposeMessageInput';
import ComposeTo from '@/components/page/main/compose/ComposeTo';
import MainContent from '@/components/page/main/MainContent';
import { useState } from 'react';

export default function page() {
  const [selectedUsers, setSelectedUsers] = useState<string[][]>([]);

  return (
    <MainContent className="grid grid-rows-[auto_1fr_auto]">
      <ComposeTo selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} />
      <ComposeFoundMessages selectedUsers={selectedUsers} />
      <ComposeMessageInput selectedUsers={selectedUsers} />
    </MainContent>
  );
}
