'use client';
import useMediasoupCall from '@/components/hooks/useMediasoupCall';
import { CallContextType } from '@/types/call.types';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect } from 'react';
import { toast } from 'sonner';
import { useLocalMedia } from './LocalMediaProvider';
import { useSocketIO } from './SocketIOProvider';

const CallContext = createContext<CallContextType | null>(null);

export function useCall() {
  const callContext = useContext(CallContext);
  if (!callContext) throw new Error('useCall must be used inside <CallProvider>');
  return callContext;
}

/** Joins the conversation's call while mounted. Must sit inside <LocalMediaProvider>. */
export default function CallProvider({ conversationId, children }: { conversationId: string; children: React.ReactNode }) {
  const socket = useSocketIO();
  const router = useRouter();
  const { localMedia, isCameraOn, isMicOn } = useLocalMedia();
  const call = useMediasoupCall({ socket, conversationId, localStream: localMedia.stream, isCameraOn, isMicOn });

  function leave() {
    router.push(`/conversation/${conversationId}`);
  }

  useEffect(() => {
    if (!socket) return;

    function onCallEnded({ reason }: { reason: string }) {
      toast(reason);
      router.push(`/conversation/${conversationId}`);
    }

    socket.on('CALL_ENDED', onCallEnded);
    return () => {
      socket.off('CALL_ENDED', onCallEnded);
    };
  }, [socket, router, conversationId]);

  return <CallContext.Provider value={{ ...call, leave }}>{children}</CallContext.Provider>;
}
