"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { Conversation } from "@/lib/types/server-data-types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CaseSensitive, Check, PenLine } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import UserAvatar from "../../UserAvatar";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PATCHRequest } from "@/lib/server/requests";

export default function AddNickname() {
  const [nicknames, setNickname] = useState<Conversation["nicknames"]>([]);
  const [open, setOpen] = useState("");
  const [new_nickname, setNewNickname] = useState<{ user: string; value: string }>({ user: "", value: "" });
  const { data: session } = useSession();
  const params = useParams<{ id: string }>();
  const { data: conversation } = useQuery<Conversation>(getConvoOptions(params.id));

  const { data: conversation_info } = useQuery<
    | {
        photo_url: string;
        conversation_name: string;
        status: "OFFLINE" | "ONLINE" | null;
        last_online: string;
      }
    | undefined
  >({
    enabled: !!conversation,
    queryKey: ["conversation", "info", conversation],
    placeholderData: { photo_url: "", conversation_name: "", status: null, last_online: "" },
  });
  const { status } = conversation_info!;

  const set_nickname = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await PATCHRequest("/v1/conversation/" + params.id + "/nicknames", {
          nicknames: new_nickname,
        });

        if (status !== "OK") throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: () => {
      setNickname((prev) => prev.map((nickname) => (nickname.user === new_nickname.user ? new_nickname : nickname)));
      setNewNickname({ user: "", value: "" });
    },
  });

  useEffect(() => {
    if (!conversation) return;

    if (!conversation.nicknames.length) {
      setNickname(conversation.members.map((user) => ({ user: user.id, value: "" })));
      return;
    }
    setNickname(conversation.nicknames);
  }, [conversation]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <span className="aspect-square h-fit w-auto bg-secondary p-2 rounded-full">
            <CaseSensitive className="h-4 w-auto text-primary" />
          </span>
          <span>Add nicknames</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Nicknames</DialogTitle>
        </DialogHeader>
        <div className="grid space-y-2">
          {nicknames.map(({ user: id, value: nickname }) => {
            return open === id ? (
              <form
                key={id}
                className="flex items-center gap-2 h-fit w-full p-2"
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  set_nickname.mutate();
                }}
              >
                <Input
                  autoFocus
                  placeholder="Set nickname"
                  onBlur={() => {
                    if (open === id && !new_nickname.value) setOpen("");
                  }}
                  value={new_nickname.value}
                  onChange={(e) => setNewNickname({ user: id, value: e.currentTarget.value })}
                />
                <Button type="submit" variant="secondary" className="aspect-square h-fit w-auto p-2">
                  <Check className="h-4 w-auto text-green-500" />
                </Button>
              </form>
            ) : (
              <Button variant="ghost" key={id} className="justify-between h-fit w-full p-2" onClick={() => setOpen(id)}>
                <div className="flex items-center gap-2">
                  <UserAvatar
                    src={
                      id === session?.user.id
                        ? session.user.photo?.url
                        : conversation?.members.find((member) => member.id === id)?.photo?.url
                    }
                    is_online={id === session?.user.id ? false : status === "ONLINE"}
                  />
                  <div className="grid gap-2 ">
                    <span className="font-medium">
                      {conversation?.members.find((member) => member.id === id)?.display_name}
                    </span>
                    {nickname ? (
                      <span>{nickname}</span>
                    ) : (
                      <span className="text-xs italic text-muted-foreground w-fit">Set nickname</span>
                    )}
                  </div>
                </div>
                <span className="aspect-square h-fit w-auto p-2 bg-primary rounded-full">
                  <PenLine className="h-4 w-auto" />
                </span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
