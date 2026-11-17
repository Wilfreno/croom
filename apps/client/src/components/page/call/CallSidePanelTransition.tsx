'use client';
import useMediaQuery from '@/components/hooks/useMediaQuery';
import { CALL_SIDE_PANEL_DOCKED_MEDIA_QUERY, CALL_SIDE_PANEL_TRANSITION_SECONDS } from '@repo/constants';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';

const dockedMotion = {
  initial: { width: 0 },
  animate: { width: 'auto' },
  exit: { width: 0 },
};

const overlayMotion = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
};

export default function CallSidePanelTransition({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  const isDocked = useMediaQuery(CALL_SIDE_PANEL_DOCKED_MEDIA_QUERY);
  const panelMotion = isDocked ? dockedMotion : overlayMotion;

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          {...panelMotion}
          transition={{ duration: CALL_SIDE_PANEL_TRANSITION_SECONDS, ease: 'easeInOut' }}
          className="absolute inset-0 z-10 sm:static sm:flex sm:shrink-0 sm:justify-end sm:overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
