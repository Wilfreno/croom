'use client';
import useUnreadCallMessages from '@/components/hooks/useUnreadCallMessages';
import { useCallSidePanel } from '@/components/providers/CallSidePanelProvider';
import { Button } from '@/components/ui/button';
import { unreadMessagesLabel } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function ChatButton() {
  const { openPanel, togglePanel } = useCallSidePanel();
  const { id: conversationId } = useParams<{ id: string }>();
  const isOpen = openPanel === 'chat';
  const unreadCount = useUnreadCallMessages(conversationId, isOpen);
  const hasUnread = unreadCount > 0;
  const label = `${isOpen ? 'Hide' : 'Show'} chat`;

  return (
    <Button
      variant="ghost"
      className="relative rounded-full text-white"
      aria-label={hasUnread ? `${label}, ${unreadMessagesLabel(unreadCount)}` : label}
      aria-expanded={isOpen}
      onClick={() => togglePanel('chat')}
    >
      <MessageSquare />
      {hasUnread && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-xs font-medium text-destructive-foreground">
          {unreadCount}
        </span>
      )}
    </Button>
  );
}
