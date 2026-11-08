'use client';
import useConversation from '@/components/hooks/queries/useConversation';
import useConversationInfo from '@/components/hooks/queries/useConversationInfo';
import useUserAgent from '@/components/hooks/useUserAgent';
import ConversationHeader from '@/components/page/main/conversation/ConversationHeader';
import ConversationMessageInput from '@/components/page/main/conversation/ConversationMessageInput';
import ConversationMessages from '@/components/page/main/conversation/ConversationMessages';
import MainContent from '@/components/page/main/MainContent';
import { useAuth } from '@/components/providers/AuthProvider';
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

  const { data: conversation, isError, error } = useConversation(params.id);

  if (isError) throw error;

  const { data: conversationInfo } = useConversationInfo(conversation!);

  if (onMobile && isOpen) return null;
  return (
    <MainContent className="grid grid-rows-[auto_1fr_auto]">
      <ConversationHeader conversationInfo={conversationInfo!} />
      <ConversationMessages conversation={conversation} />
      <ConversationMessageInput conversation={conversation} />
    </MainContent>
  );
}
