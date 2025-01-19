import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { PATCHRequest, POSTRequest } from "@/lib/server/requests";
import { Conversation } from "@/lib/types/server-data-types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Flag, LogOut, ShieldMinus } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function InfoPrivacyAndSupport() {
  const [open, setOpen] = useState(false);
  const [to_report_user, setToReportUser] = useState<{
    id: string;
    display_name: string;
  }>();
  const [report_reason, setReportSeason] = useState("");

  const { session } = useAuth();
  const params = useParams<{ id: string }>();
  const { data: conversation } = useQuery<Conversation>(getConvoOptions(params.id));

  const is_blocked = useMemo(() => {
    if (!session || !conversation) return false;

    return session.user?.blocked.some(
      (blocked_user) =>
        blocked_user ===
        conversation.members.find((member) => member.id !== session.user?.id)!.id
    );
  }, [session, conversation]);

  const report = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await POSTRequest("/v1/user/report", {
          reported_user: to_report_user?.id,
          reason: report_reason,
        });

        if (status !== "CREATED") throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("User reported");
    },
  });

  const leave_conversation = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await POSTRequest("/v1/conversation/leave", {
          conversation: params.id,
        });

        if (status !== "OK") throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
  });

  const block_user = useMutation<void, Error, "ADD" | "REMOVE">({
    mutationFn: async (blocked_action) => {
      try {
        const { status, message } = await PATCHRequest("/v1/user/blocked", {
          blocked: conversation?.members.find((member) => member.id !== session.user?.id)
            ?.id,
          blocked_action,
        });

        if (status !== "OK") throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
  });

  return (
    <Collapsible
      onOpenChange={(is_open) => {
        setOpen(is_open);
        if (is_open && !conversation?.is_group_chat) {
          const other_user = conversation?.members.find(
            (member) => member.id !== session.user?.id
          );

          setToReportUser({ id: other_user!.id, display_name: other_user!.display_name });
        }
      }}
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between font-semibold">
          <span>Privacy & Support</span>
          {open ? (
            <ChevronDown className="h-4 w-auto" />
          ) : (
            <ChevronRight className="h-4 w-auto" />
          )}
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
          <DialogContent className="p-2 w-[40dvw]">
            <DialogHeader>
              <DialogTitle></DialogTitle>
            </DialogHeader>
            {!!to_report_user ? (
              <section className="rounded-md p-2 grid gap-4">
                <div>
                  <span>Report: </span>
                  <span className="font-medium">{to_report_user.display_name}</span>
                </div>
                <Textarea
                  className="resize-none min-h-96"
                  placeholder="Reason"
                  rows={1}
                  value={report_reason}
                  onChange={(e) => setReportSeason(e.currentTarget.value)}
                />
                <div className="flex justify-between">
                  <DialogClose asChild>
                    <Button variant="secondary" className="place-self-end">
                      cancel
                    </Button>
                  </DialogClose>
                  {conversation?.is_group_chat ? (
                    <Button className="place-self-end">send</Button>
                  ) : (
                    <DialogClose
                      asChild
                      disabled={!report_reason}
                      onClick={() => report.mutate()}
                    >
                      <Button className="place-self-end">send</Button>
                    </DialogClose>
                  )}
                </div>
              </section>
            ) : (
              <section></section>
            )}
          </DialogContent>
        </Dialog>
        {conversation?.is_group_chat ? (
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => leave_conversation.mutate()}
          >
            <span className="aspect-square h-fit w-auto p-2 bg-secondary rounded-full">
              <LogOut className="h-4 w-auto stroke-2" />
            </span>
            <span>Leave group chat</span>
          </Button>
        ) : is_blocked ? (
          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={() => block_user.mutate("REMOVE")}
          >
            <span className="aspect-square h-fit w-auto p-2 bg-secondary rounded-full text-destructive">
              <ShieldMinus className="h-4 w-auto" />
            </span>
            <span>Unblock User</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => block_user.mutate("ADD")}
          >
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
