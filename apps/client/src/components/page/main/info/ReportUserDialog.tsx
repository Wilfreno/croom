import useReportUser from '@/components/hooks/mutation/useReportUser.mutation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn, isGroupChat } from '@/lib/utils';
import { REPORT_REASON_MAX_LENGTH } from '@repo/constants';
import type { Conversation, User } from '@repo/types';
import { Flag, UserRound } from 'lucide-react';
import { useState } from 'react';

export default function ReportUserDialog({ conversation }: { conversation: Conversation }) {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User>();
  const [reason, setReason] = useState('');

  const { session } = useAuth();
  const report = useReportUser(conversation.id);

  const userId = session.user?.id;
  const others = conversation.members.filter((member) => member.id !== userId);
  const groupChat = isGroupChat(conversation, userId);
  const reportedUser = groupChat ? selectedUser : others[0];
  const canSend = Boolean(reportedUser) && Boolean(reason.trim()) && !report.isPending;

  function reset() {
    setSelectedUser(undefined);
    setReason('');
  }

  function onOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) reset();
  }

  function onCancel() {
    if (groupChat) reset();
    else onOpenChange(false);
  }

  function onSend() {
    if (!reportedUser || !canSend) return;

    report.mutate({ user: reportedUser.id, reason }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <span className="aspect-square h-fit w-auto p-2 bg-secondary rounded-full text-destructive">
            <Flag className="h-4 w-auto" />
          </span>
          <span>Report User</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="p-4 w-96 max-w-[calc(100vw-2rem)]">
        {reportedUser ? (
          <section className="grid gap-4">
            <DialogHeader>
              <DialogTitle>
                <span>Report: </span>
                <span className="font-medium">{reportedUser.displayName}</span>
              </DialogTitle>
              <DialogDescription>Tell us what happened. Your report is kept private.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-1">
              <Textarea
                className="resize-none min-h-40"
                placeholder="Reason"
                maxLength={REPORT_REASON_MAX_LENGTH}
                value={reason}
                disabled={report.isPending}
                onChange={(e) => setReason(e.currentTarget.value)}
              />
              <span
                className={cn(
                  'justify-self-end text-xs text-muted-foreground tabular-nums',
                  reason.length >= REPORT_REASON_MAX_LENGTH && 'text-destructive',
                )}
              >
                {reason.length}/{REPORT_REASON_MAX_LENGTH}
              </span>
            </div>
            <div className="flex justify-between">
              <Button variant="secondary" disabled={report.isPending} onClick={onCancel}>
                cancel
              </Button>
              <Button disabled={!canSend} onClick={onSend}>
                send
              </Button>
            </div>
          </section>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Report user</DialogTitle>
              <DialogDescription>Choose who you want to report.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[40dvh]">
              <section className="grid gap-2">
                {others.map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={member.photo?.url} />
                      <AvatarFallback>
                        <UserRound className="h-1/2 w-auto" />
                      </AvatarFallback>
                    </Avatar>
                    <span>{member.displayName}</span>
                    <Button variant="destructive" className="ml-auto" onClick={() => setSelectedUser(member)}>
                      report
                    </Button>
                  </div>
                ))}
              </section>
            </ScrollArea>
            <Button variant="outline" className="justify-self-end" onClick={() => onOpenChange(false)}>
              close
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
