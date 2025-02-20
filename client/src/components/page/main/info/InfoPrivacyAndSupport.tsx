import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { DELETERequest, POSTRequest } from "@/lib/server/requests";
import { Block, Conversation } from "@/lib/types/server-data-types";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Flag,
  LogOut,
  ShieldMinus,
  UserRound,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
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

  const { data: query_response, refetch } = useQuery(getConvoOptions(params.id));

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

  const block_user = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await POSTRequest("/v1/block", {
          blocked_user: (query_response?.data as Conversation).members.find(
            (member) => member.id !== session.user?.id
          )?.id,
        });

        if (status !== "OK") throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: async () => {
      await refetch();
      toast("user as been blocked");
    },
  });

  const unblock_user = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await DELETERequest("/v1/block", {
          id: (query_response?.data as Block).id,
        });

        if (status !== "OK") throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: async () => {
      await refetch();
      toast("user unblocked");
    },
  });

  return (
    <Collapsible
      onOpenChange={(is_open) => {
        setOpen(is_open);
        if (
          is_open &&
          query_response?.status === "OK" &&
          !(query_response?.data as Conversation).is_group_chat
        ) {
          const other_user = (query_response?.data as Conversation).members.find(
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
          <DialogContent className="p-2 w-96 md:[30dvh]">
            <DialogHeader>
              <DialogTitle></DialogTitle>
            </DialogHeader>
            {!!to_report_user ? (
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
                    <Button
                      variant="secondary"
                      className="place-self-end"
                      onClick={() => setToReportUser(undefined)}
                    >
                      cancel
                    </Button>
                    {(query_response?.data as Conversation).is_group_chat ? (
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
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Report user</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[40dvh] grid gap-2 mt-4">
                  <section>
                    {(query_response?.data as Conversation).members
                      .filter((member) => member.id !== session.user?.id)
                      .map((member) => (
                        <div key={member.id} className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage src={member.photo?.url} />
                            <AvatarFallback>
                              <UserRound className="h-1/2 w-auto" />
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.display_name}</span>
                          <Button
                            variant="destructive"
                            className="ml-auto"
                            onClick={() =>
                              setToReportUser({
                                id: member.id,
                                display_name: member.display_name,
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
        {(query_response?.data as Conversation)?.is_group_chat ? (
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
        ) : query_response?.status === "BLOCKED" &&
          (query_response?.data as Block).blocker === session.user?.id ? (
          <Button
            variant="secondary"
            className="w-full justify-start text-destructive"
            onClick={() => unblock_user.mutate()}
          >
            <span className="aspect-square h-fit w-auto p-2 rounded-full ">
              <ShieldMinus className="h-4 w-auto" />
            </span>
            <span>Unblock User</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => block_user.mutate()}
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
