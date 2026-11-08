import useConversation from '@/components/hooks/queries/useConversation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { axiosInstance } from '@/lib/axios-instance';
import { isGroupChat } from '@/lib/utils';
import { SOMETHING_WENT_WRONG } from '@repo/constants';
import { ConversationStatus } from "@repo/enums";
import { useMutation } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Flag, LogOut, ShieldMinus, UserRound, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function InfoPrivacyAndSupport() {
  const [open, setOpen] = useState(false);
  const [toReportUser, setToReportUser] = useState<{
    id: string;
    displayName: string;
  }>();
  const [reportReason, setReportSeason] = useState('');

  const { session } = useAuth();
  const params = useParams<{ id: string }>();

  const { data: conversation, refetch } = useConversation(params.id);

  const report = useMutation({
    async mutationFn() {
      await axiosInstance.post('/v1/user/report', {
        reportedUser: toReportUser?.id,
        reason: reportReason,
      });
    },
    onSuccess() {
      toast.success('User reported');
    },
    onError() {
      toast.error(SOMETHING_WENT_WRONG);
    },
  });

  const leaveConversation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(`/conversation/${params.id}/leave`);
    },
    onError() {
      toast.error(SOMETHING_WENT_WRONG);
    },
  });

  const blockUser = useMutation({
    mutationFn: async () => {
      await axiosInstance.post('/v1/block', {
        user: conversation?.members.find((member) => member.id !== session.user?.id)?.id,
      });
    },
    async onSuccess() {
      await refetch();
      toast('user as been blocked');
    },
    onError() {
      toast.error(SOMETHING_WENT_WRONG);
    },
  });

  const unblockUser = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete('/v1/block');
    },
    onSuccess: async () => {
      await refetch();
      toast('user unblocked');
    },
    onError() {
      toast.error(SOMETHING_WENT_WRONG);
    },
  });

  return (
    <Collapsible
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen && conversation && !isGroupChat(conversation)) {
          const otherUser = conversation!.members.find((member) => member.id !== session.user?.id);

          setToReportUser({ id: otherUser!.id, displayName: otherUser!.displayName });
        }
      }}
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between font-semibold">
          <span>Privacy & Support</span>
          {open ? <ChevronDown className="h-4 w-auto" /> : <ChevronRight className="h-4 w-auto" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-2 p-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              <span className="aspect-square h-fit w-auto p-2 bg-secondary rounded-full text-destructive">
                <Flag className="h-4 w-auto" />
              </span>
              <span>Report User</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="p-2 w-96 md:[30dvh]">
            <DialogHeader>
              <DialogTitle></DialogTitle>
            </DialogHeader>
            {!!toReportUser ? (
              <>
                <DialogHeader>
                  <DialogTitle></DialogTitle>
                </DialogHeader>
                <DialogClose asChild className="absolute top-2 right-2">
                  <Button variant="ghost" className="aspect-square h-fit w-auto p-2">
                    <X className="h-4 w-auto" />
                  </Button>
                </DialogClose>
                <section className="rounded-md p-2 grid gap-4">
                  <div>
                    <span>Report: </span>
                    <span className="font-medium">{toReportUser.displayName}</span>
                  </div>
                  <Textarea
                    className="resize-none min-h-96"
                    placeholder="Reason"
                    rows={1}
                    value={reportReason}
                    onChange={(e) => setReportSeason(e.currentTarget.value)}
                  />
                  <div className="flex justify-between">
                    <Button variant="secondary" className="place-self-end" onClick={() => setToReportUser(undefined)}>
                      cancel
                    </Button>
                    {isGroupChat(conversation!) ? (
                      <Button className="place-self-end">send</Button>
                    ) : (
                      <DialogClose asChild disabled={!reportReason} onClick={() => report.mutate()}>
                        <Button className="place-self-end">send</Button>
                      </DialogClose>
                    )}
                  </div>
                </section>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Report user</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[40dvh] grid gap-2 mt-4">
                  <section>
                    {conversation?.members
                      .filter((member) => member.id !== session.user?.id)
                      .map((member) => (
                        <div key={member.id} className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage src={member.photo?.url} />
                            <AvatarFallback>
                              <UserRound className="h-1/2 w-auto" />
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.displayName}</span>
                          <Button
                            variant="destructive"
                            className="ml-auto"
                            onClick={() =>
                              setToReportUser({
                                id: member.id,
                                displayName: member.displayName,
                              })
                            }
                          >
                            report
                          </Button>
                        </div>
                      ))}
                  </section>
                </ScrollArea>

                <DialogClose asChild className="justify-self-end">
                  <Button variant="outline">close</Button>
                </DialogClose>
              </>
            )}
          </DialogContent>
        </Dialog>
        {Boolean(conversation) && isGroupChat(conversation!) ? (
          <Button variant="ghost" className="w-full justify-start" onClick={() => leaveConversation.mutate()}>
            <span className="aspect-square h-fit w-auto p-2 bg-secondary rounded-full">
              <LogOut className="h-4 w-auto stroke-2" />
            </span>
            <span>Leave group chat</span>
          </Button>
        ) : conversation?.status === ConversationStatus.BLOCKED && conversation?.blocker === session.user?.id ? (
          <Button
            variant="secondary"
            className="w-full justify-start text-destructive"
            onClick={() => unblockUser.mutate()}
          >
            <span className="aspect-square h-fit w-auto p-2 rounded-full ">
              <ShieldMinus className="h-4 w-auto" />
            </span>
            <span>Unblock User</span>
          </Button>
        ) : (
          <Button variant="ghost" className="w-full justify-start" onClick={() => blockUser.mutate()}>
            <span className="aspect-square h-fit w-auto p-2 bg-secondary rounded-full text-destructive">
              <ShieldMinus className="h-4 w-auto" />
            </span>
            <span>Block User</span>
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
