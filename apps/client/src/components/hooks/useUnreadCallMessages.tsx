'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSocketIO } from '@/components/providers/SocketIOProvider';
import { MessagePayload } from '@repo/types';
import { useEffect, useState } from 'react';

export default function useUnreadCallMessages(conversationId: string, isChatOpen: boolean) {
  const socket = useSocketIO();
  const { session } = useAuth();
  const userId = session.user?.id;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
      return;
    }
    if (!socket) return;

    function onMessage(message: MessagePayload) {
      const isFromSomeoneElse = message.sender.id !== userId;
      if (message.conversation.id !== conversationId || message.notice || !isFromSomeoneElse) return;
      setUnreadCount((count) => count + 1);
    }

    socket.on('MESSAGE', onMessage);
    return () => {
      socket.off('MESSAGE', onMessage);
    };
  }, [socket, isChatOpen, conversationId, userId]);

  return unreadCount;
}
