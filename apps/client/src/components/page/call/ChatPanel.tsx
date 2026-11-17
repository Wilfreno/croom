'use client';
import useConversation from '@/components/hooks/queries/useConversation';
import ConversationMessageInput from '@/components/page/main/conversation/ConversationMessageInput';
import ConversationMessages from '@/components/page/main/conversation/ConversationMessages';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCallSidePanel } from '@/components/providers/CallSidePanelProvider';
import { Button } from '@/components/ui/button';
import { getConversationName } from '@/lib/utils';
import { X } from 'lucide-react';
import { useParams } from 'next/navigation';
import CallSidePanelTransition from './CallSidePanelTransition';

export default function ChatPanel() {
  const { openPanel } = useCallSidePanel();

  return (
    <CallSidePanelTransition isOpen={openPanel === 'chat'}>
      <ChatPanelContent />
    </CallSidePanelTransition>
  );
}

function ChatPanelContent() {
  const { setOpenPanel } = useCallSidePanel();
  const { id: conversationId } = useParams<{ id: string }>();
  const { data: conversation } = useConversation(conversationId);
  const { session } = useAuth();
  const title = conversation ? getConversationName(conversation, session.user?.id) : 'Chat';

  return (
    <aside
      aria-label="Chat"
      className="flex h-full shrink-0 flex-col bg-background sm:w-96 sm:border-l xl:w-[28rem]"
    >
      <header className="flex items-center justify-between gap-2 border-b p-4">
        <h2 className="truncate font-semibold">{title}</h2>
        <Button variant="ghost" size="icon" className="shrink-0 rounded-full" aria-label="Close chat" onClick={() => setOpenPanel(null)}>
          <X />
        </Button>
      </header>
      <div className="min-h-0 grow">
        <ConversationMessages conversation={conversation} className="max-h-none" />
      </div>
      <div className="shrink-0 sm:pb-8">
        <ConversationMessageInput conversation={conversation} />
      </div>
    </aside>
  );
}
