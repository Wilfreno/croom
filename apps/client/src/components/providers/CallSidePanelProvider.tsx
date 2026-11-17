'use client';
import { CallSidePanel, CallSidePanelContextType } from '@/types/call.types';
import React, { createContext, useContext, useState } from 'react';

const CallSidePanelContext = createContext<CallSidePanelContextType | null>(null);

export function useCallSidePanel() {
  const callSidePanelContext = useContext(CallSidePanelContext);
  if (!callSidePanelContext) throw new Error('useCallSidePanel must be used inside <CallSidePanelProvider>');
  return callSidePanelContext;
}

export default function CallSidePanelProvider({ children }: { children: React.ReactNode }) {
  const [openPanel, setOpenPanel] = useState<CallSidePanel | null>(null);

  function togglePanel(panel: CallSidePanel) {
    setOpenPanel((current) => (current === panel ? null : panel));
  }

  return (
    <CallSidePanelContext.Provider value={{ openPanel, setOpenPanel, togglePanel }}>
      {children}
    </CallSidePanelContext.Provider>
  );
}
