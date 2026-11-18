'use client';
import useMediaQuery from '@/components/hooks/useMediaQuery';
import {
  CALL_SIDE_PANEL_DOCKED_MEDIA_QUERY,
  CALL_SIDE_PANEL_DOCKED_MOTION,
  CALL_SIDE_PANEL_OVERLAY_MOTION,
  CALL_SIDE_PANEL_TRANSITION_SECONDS,
} from '@repo/constants';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';

export default function CallSidePanelTransition({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  const isDocked = useMediaQuery(CALL_SIDE_PANEL_DOCKED_MEDIA_QUERY);
  const panelMotion = isDocked ? CALL_SIDE_PANEL_DOCKED_MOTION : CALL_SIDE_PANEL_OVERLAY_MOTION;

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
