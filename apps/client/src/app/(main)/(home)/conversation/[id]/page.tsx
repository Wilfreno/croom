'use client';
import useUserAgent from '@/components/hooks/useUserAgent';
import ConversationHeader from '@/components/page/main/conversation/ConversationHeader';
import ConversationMessageInput from '@/components/page/main/conversation/ConversationMessageInput';
import ConversationMessages from '@/components/page/main/conversation/ConversationMessages';
import MainContent from '@/components/page/main/MainContent';
import { useAuth } from '@/components/providers/AuthProvider';
import { getConvoOptions } from '@/lib/react-query/prefetch-query-options';
import { Block, Conversation, User } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export default function Page() {
  const { onMobile } = useUserAgent();
  const { session } = useAuth();
  const params = useParams<{ id: string }>();
  const { data: isOpen } = useQuery({
    queryKey: ['sidebar', 'info', 'open', onMobile],
    queryFn: () => !onMobile,
  });

  const { data: queryResponse } = useQuery({
    enabled: !!session,
    ...getConvoOptions(params.id),
  });

  if (queryResponse && queryResponse.status !== 'OK' && queryResponse.status !== 'BLOCKED')
    throw new Error(queryResponse.message);

  useQuery({
    enabled: !!session.user?.id && !!queryResponse,
    queryKey: ['conversation', 'info', queryResponse],
    queryFn: () => {
      let conversation: Conversation;
      let lastOnline = '';
      let photoUrl: string;
      let conversationName = '';
      let status: User['status'] | null = null;

      if (queryResponse?.status === 'OK') {
        conversation = queryResponse.data as Conversation;
      } else {
        conversation = (queryResponse?.data as Block).conversation;
      }
      if (conversation.isGroupChat) {
        photoUrl = conversation.photo?.url || '';
        conversationName = conversation.name;
      } else {
        const otherUser = conversation.members.find((member) => member.id !== session.user?.id);
        if (!otherUser) return { photoUrl: '', conversationName: '', status: null, lastOnline };

        status = otherUser.status;
        photoUrl = otherUser.photo?.url || '';

        conversationName = conversation.nicknames.find((nickname) => nickname.user === otherUser.id)!.value;
        if (!conversationName) conversationName = otherUser.displayName;

        if (otherUser.status === 'OFFLINE') {
          const lastOnlineDate = new Date(otherUser.lastOnline);
          const now = new Date();

          const lastOnlineInSeconds = Math.floor((now.getTime() - lastOnlineDate.getTime()) / 1000);
          const minutes = 60;
          const hour = 60 * 60;
          const day = 60 * 60 * 24;

          if (lastOnlineInSeconds > day) {
            lastOnline = Math.floor(lastOnlineInSeconds / day) + ' day(s) ago';
          } else if (lastOnlineInSeconds > hour && lastOnlineInSeconds < day) {
            lastOnline = Math.floor(lastOnlineInSeconds / hour) + ' hour(s) ago';
          } else if (lastOnlineInSeconds > minutes && lastOnlineInSeconds < hour) {
            lastOnline = Math.floor(lastOnlineInSeconds / minutes) + ' minute(s) ago';
          } else {
            lastOnline = lastOnlineInSeconds + ' second(s) ago';
          }
        }
      }
      return {
        photoUrl,
        conversationName,
        status,
        lastOnline,
      };
    },
    placeholderData: {
      photoUrl: undefined!,
      conversationName: '',
      status: null,
      lastOnline: '',
    },
  });

  if (onMobile && isOpen) return null;
  return (
    <MainContent className="grid grid-rows-[auto_1fr_auto]">
      <ConversationHeader />
      <ConversationMessages />
      <ConversationMessageInput />
    </MainContent>
  );
}
