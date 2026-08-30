'use client';
import useDebounce from '@/components/hooks/useDebounce';
import { useAuth } from '@/components/providers/AuthProvider';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Conversation } from '@repo/types';
import { useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SearchConversation() {
  const [inputValue, setInputValue] = useState('');
  const debouncedValue = useDebounce(inputValue);

  const { session } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!debouncedValue) {
      queryClient.resetQueries({ exact: true, queryKey: ['conversation', 'search'] });
    } else {
      const conversations = queryClient.getQueryData<Conversation[]>([session.user?.id, 'conversations']);
      if (!conversations) return;
      const result = conversations.filter(
        (convo) =>
          convo.name.toLowerCase().startsWith(debouncedValue.toLowerCase()) ||
          convo.members[0].displayName.toLowerCase().startsWith(debouncedValue.toLowerCase()),
      );
      queryClient.setQueryData(['conversation', 'search'], result);
    }
  }, [debouncedValue]);

  return (
    <div className="relative">
      <Label htmlFor="search" className="absolute top-1/2 left-2 -translate-y-1/2">
        <Search className="h-4" />
      </Label>
      <Input
        autoComplete="off"
        placeholder="Search"
        id="search"
        className="pl-8"
        value={inputValue}
        onChange={(e) => setInputValue(e.currentTarget.value)}
      />
    </div>
  );
}
