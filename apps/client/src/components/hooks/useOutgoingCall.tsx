'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSocketIO } from '@/components/providers/SocketIOProvider';
import { emitSocketEventAndWaitForServerReply } from '@/lib/utils';
import { OutgoingCallStatus } from '@/types/call.types';
import { CALL_RING_DURATION_MS } from '@repo/constants';
import { CallAnswerPayload } from '@repo/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function useOutgoingCall(conversationId: string, recipientCount: number) {
  const socket = useSocketIO();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session.user?.id;
  const [status, setStatus] = useState<OutgoingCallStatus>('idle');

  useEffect(() => {
    if (status !== 'ringing' || !socket) return;
    const declinedUserIds = new Set<string>();

    function isAnswerToThisCall(answer: CallAnswerPayload) {
      return answer.conversationId === conversationId && answer.userId !== userId;
    }
    function onAccepted(answer: CallAnswerPayload) {
      if (isAnswerToThisCall(answer)) router.push(`/call/${conversationId}`);
    }
    function onDeclined(answer: CallAnswerPayload) {
      if (!isAnswerToThisCall(answer)) return;
      declinedUserIds.add(answer.userId);
      if (declinedUserIds.size >= recipientCount) setStatus('declined');
    }

    const ringTimeoutId = setTimeout(() => {
      socket.emit('CALL_CANCEL', { conversationId });
      setStatus('unanswered');
    }, CALL_RING_DURATION_MS);
    socket.on('CALL_ACCEPTED', onAccepted);
    socket.on('CALL_DECLINED', onDeclined);

    return () => {
      clearTimeout(ringTimeoutId);
      socket.off('CALL_ACCEPTED', onAccepted);
      socket.off('CALL_DECLINED', onDeclined);
    };
  }, [status, socket, conversationId, recipientCount, userId, router]);

  async function start() {
    if (!socket) return;
    const hasSomeoneToRing = recipientCount > 0;
    if (hasSomeoneToRing) setStatus('ringing');

    try {
      const { isOngoing } = await emitSocketEventAndWaitForServerReply(socket, 'CALL', { conversationId });
      if (isOngoing || !hasSomeoneToRing) router.push(`/call/${conversationId}`);
    } catch {
      setStatus('idle');
    }
  }

  function cancel() {
    socket?.emit('CALL_CANCEL', { conversationId });
    setStatus('idle');
  }

  function close() {
    setStatus('idle');
  }

  return { status, start, cancel, close };
}
