'use client';
import useUserAgent from '@/components/hooks/useUserAgent';
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getConvoOptions } from '@/lib/react-query/prefetch-query-options';
import { cn } from '@/lib/utils';
import { Block, Conversation } from '@repo/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserRound } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import SidebarContent from '../SidebarContent';
import InfoCustomization from './InfoCustomization';
import InfoMedia from './InfoMedia';
import InfoPrivacyAndSupport from './InfoPrivacyAndSupport';

const InfoAdminsAndMembers = dynamic(() => import('./InfoAdminsAndMembers'), {
  ssr: false,
});

export default function InfoSidebar() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { onMobile } = useUserAgent();

  const { data: isOpen } = useQuery({
    queryKey: ['sidebar', 'info', 'open', onMobile],
  });
  const { data: queryResponse } = useQuery(getConvoOptions(params.id));

  const { data: conversationInfo } = useQuery<{
    photoUrl: string;
    conversationName: string;
    status: 'OFFLINE' | 'ONLINE' | null;
    lastOnline: string;
  }>({
    queryKey: ['conversation', 'info', queryResponse],
  });

  const hide = useMemo(() => {
    if (!queryResponse || !session.user) return true;

    if (queryResponse.status === 'BLOCKED') {
      return session.user.id !== (queryResponse?.data as Block).blocker;
    }

    return !(queryResponse?.data as Conversation).members.find((member) => member.id !== session.user?.id);
  }, [queryResponse, session.user]);

  return (
    <SidebarContent className={cn(!isOpen && 'hidden', 'relative')}>
      <Button
        variant="ghost"
        className="md:hidden absolute top-2 left-0"
        onClick={() => queryClient.setQueryData<boolean>(['sidebar', 'info', 'open', onMobile], false)}
      >
        <ArrowLeft className="h-6 w-auto" />
      </Button>
      <div className="flex flex-col items-center gap-4 my-10">
        <span className="relative">
          <Avatar className="aspect-square h-28 w-auto">
            <AvatarImage src={conversationInfo?.photoUrl} />
            <AvatarFallback>
              <UserRound className="h-1/2 w-auto" />
            </AvatarFallback>
          </Avatar>
          {status === 'ONLINE' && (
            <div className="bg-green-500 aspect-square h-8 border-2 border-background w-auto rounded-full absolute bottom-1 right-0"></div>
          )}
        </span>
        <div className="text-center">
          <p className="font-medium text-lg truncate max-w-72">{conversationInfo?.conversationName}</p>
          {!!conversationInfo?.lastOnline && (
            <p className="text-xs font-medium text-muted-foreground">Online {conversationInfo?.lastOnline}</p>
          )}
        </div>
      </div>
      {!hide && (
        <ScrollArea className="h-[60dvh]">
          <div className="grid gap-2">
            <InfoCustomization />
            <InfoAdminsAndMembers />
            <InfoMedia />
            <InfoPrivacyAndSupport />
          </div>
        </ScrollArea>
      )}
    </SidebarContent>
  );
}
