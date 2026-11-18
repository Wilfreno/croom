'use client';
import useRingtone from '@/components/hooks/useRingtone';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { OutgoingCallStatus } from '@/types/call.types';
import { CALL_RINGBACK_TONE } from '@repo/constants';
import { PhoneOff, Video } from 'lucide-react';
import React from 'react';

const statusText: Record<Exclude<OutgoingCallStatus, 'idle'>, string> = {
  ringing: 'Calling…',
  declined: 'Call declined',
  unanswered: 'No answer',
};

export default function OutgoingCallDialog({
  status,
  name,
  avatar,
  onCancel,
  onClose,
  onCallAgain,
}: {
  status: OutgoingCallStatus;
  name: string;
  avatar: React.ReactNode;
  onCancel: () => void;
  onClose: () => void;
  onCallAgain: () => void;
}) {
  const isRinging = status === 'ringing';
  useRingtone(CALL_RINGBACK_TONE, isRinging);

  function onOpenChange(open: boolean) {
    if (open) return;
    if (isRinging) onCancel();
    else onClose();
  }

  return (
    <Dialog open={status !== 'idle'} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs justify-items-center gap-6 rounded-2xl py-10 sm:max-w-sm">
        <div className="relative grid place-items-center">
          {isRinging && (
            <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
          )}
          <div className={cn('relative rounded-full', isRinging && 'ring-4 ring-primary/40')}>{avatar}</div>
        </div>
        <div className="grid max-w-full gap-1 text-center">
          <DialogTitle className="truncate text-xl">{name}</DialogTitle>
          <DialogDescription className={cn(isRinging && 'animate-pulse')}>
            {status === 'idle' ? '' : statusText[status]}
          </DialogDescription>
        </div>
        {isRinging ? (
          <Button
            variant="destructive"
            className="h-14 w-14 rounded-full p-0 [&_svg]:h-6 [&_svg]:w-6"
            aria-label="Cancel call"
            onClick={onCancel}
          >
            <PhoneOff />
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="outline" className="h-10 rounded-full px-5" onClick={onClose}>
              Close
            </Button>
            <Button className="h-10 gap-2 rounded-full px-5" onClick={onCallAgain}>
              <Video className="h-4 w-4" />
              Call again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
