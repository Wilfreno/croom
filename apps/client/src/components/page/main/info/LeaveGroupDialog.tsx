'use client';

import useLeaveConversation from '@/components/hooks/mutation/useLeaveConversation.mutation';
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
import type { Conversation } from '@repo/types';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

function getLeaveDescription({
  mustAssignAdmin,
  newAdminName,
  isLastMember,
}: {
  mustAssignAdmin: boolean;
  newAdminName?: string;
  isLastMember: boolean;
}) {
  if (mustAssignAdmin) return "You're the only admin. Make another member an admin before you leave.";
  if (newAdminName) return `${newAdminName} will become the admin of this group.`;
  if (isLastMember) return "You're the last member, so this group chat will be deleted.";
  return "You'll stop getting messages from this group, and it will be removed from your chats.";
}

export default function LeaveGroupDialog({ conversation }: { conversation: Conversation }) {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const leaveConversation = useLeaveConversation();

  const userId = session.user?.id;
  const otherMembers = conversation.members.filter((member) => member.id !== userId);
  const isAdmin = conversation.admins.some((admin) => admin.id === userId);
  const isOnlyAdmin = isAdmin && conversation.admins.length === 1;
  const mustAssignAdmin = isOnlyAdmin && otherMembers.length > 1;
  const newAdmin = isOnlyAdmin && otherMembers.length === 1 ? otherMembers[0] : undefined;

  const description = getLeaveDescription({
    mustAssignAdmin,
    newAdminName: newAdmin?.displayName,
    isLastMember: otherMembers.length === 0,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <span className="aspect-square h-fit w-auto p-2 bg-secondary rounded-full">
            <LogOut className="h-4 w-auto stroke-2" />
          </span>
          <span>Leave group chat</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-96">
        <DialogHeader>
          <DialogTitle>Leave group chat?</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={mustAssignAdmin || leaveConversation.isPending}
            onClick={() => leaveConversation.mutate(conversation.id, { onSuccess: () => setOpen(false) })}
          >
            Leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
