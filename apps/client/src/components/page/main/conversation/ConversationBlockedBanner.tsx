'use client';

import useBlockConversation from '@/components/hooks/mutation/useBlockConversation.mutation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Conversation } from '@repo/types';
import { useState } from 'react';

export default function ConversationBlockedBanner({ conversation }: { conversation: Conversation }) {
  const { session } = useAuth();
  const { unblockConversation } = useBlockConversation();
  const [confirmUnblockOpen, setConfirmUnblockOpen] = useState(false);

  if (!session.user) return null;

  if (String(conversation.blocker) === session.user.id)
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-primary/80 px-4 py-3 text-center font-medium text-accent rounded-b-md">
        <span>You blocked this person</span>
        <Dialog open={confirmUnblockOpen} onOpenChange={setConfirmUnblockOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm">
              Unblock
            </Button>
          </DialogTrigger>
          <DialogContent className="w-96">
            <DialogHeader>
              <DialogTitle>Unblock this person?</DialogTitle>
              <DialogDescription>You&apos;ll both be able to message each other in this conversation again.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                disabled={unblockConversation.isPending}
                onClick={() =>
                  unblockConversation.mutate(conversation.id, { onSuccess: () => setConfirmUnblockOpen(false) })
                }
              >
                Unblock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );

  return (
    <div className="bg-primary/80 py-4 text-center font-medium text-accent rounded-b-md">
      <span>You have been blocked</span>
    </div>
  );
}
