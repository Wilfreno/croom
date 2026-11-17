'use client';
import { ParticipantsPanelContextType } from '@/types/call.types';
import React, { createContext, useContext, useState } from 'react';

const ParticipantsPanelContext = createContext<ParticipantsPanelContextType | null>(null);

export function useParticipantsPanel() {
  const participantsPanelContext = useContext(ParticipantsPanelContext);
  if (!participantsPanelContext)
    throw new Error('useParticipantsPanel must be used inside <ParticipantsPanelProvider>');
  return participantsPanelContext;
}

export default function ParticipantsPanelProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ParticipantsPanelContext.Provider value={{ isOpen, setIsOpen }}>{children}</ParticipantsPanelContext.Provider>
  );
}
