'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSocketIO } from '@/components/providers/SocketIOProvider';
import { emitSocketEventAndWaitForServerReply, stopCallRing } from '@/lib/utils';
import { ActiveOutgoingCall, OutgoingCallStatus, OutgoingCallTarget } from '@/types/call.types';
import { CALL_RING_DURATION_MS } from '@repo/constants';
import { CallAnswerPayload, CallPayload } from '@repo/types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function useOutgoingCall() {
  const socket = useSocketIO();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session.user?.id;
  const [status, setStatus] = useState<OutgoingCallStatus>('idle');
  const [target, setTarget] = useState<OutgoingCallTarget | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const activeCallRef = useRef<ActiveOutgoingCall | null>(null);
  const ringTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const endActiveCall = useCallback(() => {
    activeCallRef.current = null;
    if (ringTimeoutIdRef.current) clearTimeout(ringTimeoutIdRef.current);
    ringTimeoutIdRef.current = null;
  }, []);

  const finishCall = useCallback(
    (nextStatus: OutgoingCallStatus) => {
      endActiveCall();
      setStatus(nextStatus);
    },
    [endActiveCall],
  );

  const joinCall = useCallback(
    (conversationId: string) => {
      endActiveCall();
      router.push(`/call/${conversationId}`);
    },
    [endActiveCall, router],
  );

  useEffect(() => {
    if (!socket) return;

    function activeCallFor(conversationId: string) {
      const call = activeCallRef.current;
      return call?.conversationId === conversationId ? call : null;
    }
    function onAccepted(answer: CallAnswerPayload) {
      if (answer.userId !== userId && activeCallFor(answer.conversationId)) joinCall(answer.conversationId);
    }
    function onDeclined(answer: CallAnswerPayload) {
      const call = activeCallFor(answer.conversationId);
      if (!call || answer.userId === userId) return;

      call.declinedUserIds.add(answer.userId);
      const hasEveryoneDeclined = call.ringingCount !== null && call.declinedUserIds.size >= call.ringingCount;
      if (hasEveryoneDeclined) finishCall('declined');
    }
    function onCancelled(cancelled: CallPayload) {
      const call = activeCallFor(cancelled.conversationId);
      if (!call) return;

      if (call.ringingCount === null) call.isCancelled = true;
      else finishCall('unanswered');
    }

    socket.on('CALL_ACCEPTED', onAccepted);
    socket.on('CALL_DECLINED', onDeclined);
    socket.on('CALL_CANCELLED', onCancelled);
    return () => {
      socket.off('CALL_ACCEPTED', onAccepted);
      socket.off('CALL_DECLINED', onDeclined);
      socket.off('CALL_CANCELLED', onCancelled);
    };
  }, [socket, userId, joinCall, finishCall]);

  useEffect(() => {
    if (!socket) return;

    return () => {
      const call = activeCallRef.current;
      if (!call) return;
      stopCallRing(socket, call.conversationId);
      finishCall('unanswered');
    };
  }, [socket, finishCall]);

  async function start(callTarget: OutgoingCallTarget) {
    if (!socket || isStarting) return;
    const { conversationId } = callTarget;
    const call: ActiveOutgoingCall = { conversationId, ringingCount: null, declinedUserIds: new Set(), isCancelled: false };
    activeCallRef.current = call;
    setTarget(callTarget);
    setIsStarting(true);

    try {
      const { isOngoing, ringingCount } = await emitSocketEventAndWaitForServerReply(socket, 'CALL', { conversationId });
      if (activeCallRef.current !== call) return;
      if (isOngoing || !ringingCount) {
        joinCall(conversationId);
        return;
      }

      call.ringingCount = ringingCount;
      if (call.isCancelled) {
        finishCall('unanswered');
        return;
      }
      if (call.declinedUserIds.size >= ringingCount) {
        finishCall('declined');
        return;
      }

      setStatus('ringing');
      ringTimeoutIdRef.current = setTimeout(async () => {
        if (activeCallRef.current !== call) return;
        const isAnswered = await stopCallRing(socket, conversationId);
        if (isAnswered) joinCall(conversationId);
        else finishCall('unanswered');
      }, CALL_RING_DURATION_MS);
    } catch {
      if (activeCallRef.current === call) finishCall('idle');
    } finally {
      setIsStarting(false);
    }
  }

  function callAgain() {
    if (target) start(target);
  }

  async function cancel() {
    const call = activeCallRef.current;
    finishCall('idle');
    if (!socket || !call) return;
    if (await stopCallRing(socket, call.conversationId)) router.push(`/call/${call.conversationId}`);
  }

  function close() {
    setStatus('idle');
  }

  return { status, isStarting, start, callAgain, cancel, close };
}
