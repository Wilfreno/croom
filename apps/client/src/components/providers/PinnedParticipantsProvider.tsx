'use client';
import { PinnedParticipantsContextType } from '@/types/call.types';
import React, { createContext, useContext, useState } from 'react';

const PinnedParticipantsContext = createContext<PinnedParticipantsContextType | null>(null);

export function usePinnedParticipants() {
  const pinnedParticipantsContext = useContext(PinnedParticipantsContext);
  if (!pinnedParticipantsContext)
    throw new Error('usePinnedParticipants must be used inside <PinnedParticipantsProvider>');
  return pinnedParticipantsContext;
}

export default function PinnedParticipantsProvider({ children }: { children: React.ReactNode }) {
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);

  function isPinned(peerId: string) {
    return pinnedPeerId === peerId;
  }

  function togglePin(peerId: string) {
    setPinnedPeerId((currentPeerId) => (currentPeerId === peerId ? null : peerId));
  }

  return (
    <PinnedParticipantsContext.Provider value={{ pinnedPeerId, isPinned, togglePin }}>{children}</PinnedParticipantsContext.Provider>
  );
}
