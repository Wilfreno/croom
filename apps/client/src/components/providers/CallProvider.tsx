'use client';
import useMediasoupCall from '@/components/hooks/useMediasoupCall';
import { CallContextType } from '@/types/call.types';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext } from 'react';
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
  const { localMedia, isCameraOn } = useLocalMedia();
  const call = useMediasoupCall({ socket, conversationId, localStream: localMedia.stream, isCameraOn });

  function leave() {
    router.push(`/conversation/${conversationId}`);
  }

  return <CallContext.Provider value={{ ...call, leave }}>{children}</CallContext.Provider>;
}
