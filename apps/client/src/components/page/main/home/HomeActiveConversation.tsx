'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { GETRequest } from '@/lib/server/requests';
import { Conversation } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import UserAvatar from '../UserAvatar';

export default function HomeActiveConversations() {
  const { session } = useAuth();

  const { data: activeConversations } = useQuery({
    enabled: !!session,
    queryKey: [session.user?.id, 'active', 'conversations'],
    queryFn: async () => {
      try {
        const { data, status, message } = await GETRequest<Conversation[]>('/v1/user/active-conversation');

        if (status !== 'OK') throw new Error(message);

        return data;
      } catch (error) {
        throw error;
      }
    },
    placeholderData: [],
  });

  return (
    <section className="w-full flex flex-col gap-1">
      <p className="font-bold hidden md:block">Active Conversations</p>
      <ScrollArea className="w-[22rem] md:w-80 md:min-h-20 py-2 md:pb-3">
        <div className="flex items-center gap-2 mx-auto">
          {activeConversations?.map((conversation) => (
            <Link key={conversation.id} href={'/conversation/' + conversation.id}>
              <div className="flex flex-col items-center gap-1 h-fit w-fit">
                <UserAvatar
                  isOnline
                  src={conversation.isGroupChat ? conversation.photo?.url : conversation.members[0].photo?.url}
                />
                <span className="text-xs font-medium w-14 truncate">
                  {conversation.isGroupChat ? conversation.name : conversation.members[0].displayName}
                </span>
              </div>
            </Link>
          ))}
          <ScrollBar orientation="horizontal" />
        </div>
      </ScrollArea>
    </section>
  );
}
