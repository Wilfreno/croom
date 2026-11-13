'use client';
import useConversation from '@/components/hooks/queries/useConversation';
import useConversationInfo from '@/components/hooks/queries/useConversationInfo';
import useInfoSidebarOpen from '@/components/hooks/queries/useInfoSidebarOpen';
import ConversationHeader from '@/components/page/main/conversation/ConversationHeader';
import ConversationMessageInput from '@/components/page/main/conversation/ConversationMessageInput';
import ConversationMessages from '@/components/page/main/conversation/ConversationMessages';
import MainContent from '@/components/page/main/MainContent';
import { useParams } from 'next/navigation';

export default function Page() {
  const { isOpen, onMobile } = useInfoSidebarOpen();
  const params = useParams<{ id: string }>();
  const { data: conversation, isError, error } = useConversation(params.id);

  if (isError) throw error;

  const { data: conversationInfo } = useConversationInfo(conversation!);

  if (onMobile && isOpen) return null;
  return (
    <MainContent className="grid grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto]">
      <ConversationHeader conversationInfo={conversationInfo!} />
      <ConversationMessages conversation={conversation} />
      <ConversationMessageInput conversation={conversation} />
    </MainContent>
  );
}
