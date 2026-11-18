'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSocketIO } from '@/components/providers/SocketIOProvider';
import { emitSocketEventAndWaitForServerReply } from '@/lib/utils';
import { OutgoingCallStatus, OutgoingCallTarget } from '@/types/call.types';
import { TypedSocket } from '@/types/socket.types';
import { CALL_RING_DURATION_MS } from '@repo/constants';
import { CallAnswerPayload, CallPayload } from '@repo/types';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

async function stopRinging(socket: TypedSocket, conversationId: string) {
  const reply = await emitSocketEventAndWaitForServerReply(socket, 'CALL_CANCEL', { conversationId }).catch(() => null);
  return Boolean(reply?.isAnswered);
}

export default function useOutgoingCall() {
  const socket = useSocketIO();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session.user?.id;
  const [status, setStatus] = useState<OutgoingCallStatus>('idle');
  const [target, setTarget] = useState<OutgoingCallTarget | null>(null);
  const ringingConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    ringingConversationIdRef.current = status === 'ringing' && target ? target.conversationId : null;
  }, [status, target]);

  useEffect(() => {
    if (!socket) return;

    return () => {
      const conversationId = ringingConversationIdRef.current;
      ringingConversationIdRef.current = null;
      if (!conversationId) return;
      stopRinging(socket, conversationId);
      setStatus('unanswered');
    };
  }, [socket]);

  useEffect(() => {
    if (status !== 'ringing' || !socket || !target) return;
    const { conversationId, recipientCount } = target;
    const declinedUserIds = new Set<string>();

    function joinCall() {
      ringingConversationIdRef.current = null;
      router.push(`/call/${conversationId}`);
    }
    function isAnswerToThisCall(answer: CallAnswerPayload) {
      return answer.conversationId === conversationId && answer.userId !== userId;
    }
    function onAccepted(answer: CallAnswerPayload) {
      if (isAnswerToThisCall(answer)) joinCall();
    }
    function onCancelled(cancelled: CallPayload) {
      if (cancelled.conversationId === conversationId) setStatus('unanswered');
    }
    function onDeclined(answer: CallAnswerPayload) {
      if (!isAnswerToThisCall(answer)) return;
      declinedUserIds.add(answer.userId);
      if (declinedUserIds.size >= recipientCount) setStatus('declined');
    }

    const ringTimeoutId = setTimeout(async () => {
      if (await stopRinging(socket, conversationId)) joinCall();
      else setStatus('unanswered');
    }, CALL_RING_DURATION_MS);
    socket.on('CALL_ACCEPTED', onAccepted);
    socket.on('CALL_DECLINED', onDeclined);
    socket.on('CALL_CANCELLED', onCancelled);

    return () => {
      clearTimeout(ringTimeoutId);
      socket.off('CALL_ACCEPTED', onAccepted);
      socket.off('CALL_DECLINED', onDeclined);
      socket.off('CALL_CANCELLED', onCancelled);
    };
  }, [status, socket, target, userId, router]);

  async function start(callTarget: OutgoingCallTarget) {
    if (!socket) return;

    try {
      const { isOngoing, ringingCount } = await emitSocketEventAndWaitForServerReply(socket, 'CALL', {
        conversationId: callTarget.conversationId,
      });
      if (isOngoing || !ringingCount) {
        router.push(`/call/${callTarget.conversationId}`);
        return;
      }
      setTarget({ ...callTarget, recipientCount: ringingCount });
      setStatus('ringing');
    } catch {
      setStatus('idle');
    }
  }

  function callAgain() {
    if (target) start(target);
  }

  async function cancel() {
    setStatus('idle');
    if (!socket || !target) return;
    if (await stopRinging(socket, target.conversationId)) router.push(`/call/${target.conversationId}`);
  }

  function close() {
    setStatus('idle');
  }

  return { status, start, callAgain, cancel, close };
}
