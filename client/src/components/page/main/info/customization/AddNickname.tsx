"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { Conversation } from "@/lib/types/server-data-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CaseSensitive, Check, PenLine, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import UserAvatar from "../../UserAvatar";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PATCHRequest } from "@/lib/server/requests";

export default function AddNickname() {
  const [nicknames, setNickname] = useState<Conversation["nicknames"]>([]);
  const [selected, setSelected] = useState("");
  const [new_nickname, setNewNickname] = useState<{ user: string; value: string }>({ user: "", value: "" });

  const { data: session } = useSession();
  const params = useParams<{ id: string }>();
  const { data: conversation } = useQuery<Conversation>(getConvoOptions(params.id));
  const query_client = useQueryClient();

  const set_nickname = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await PATCHRequest("/v1/conversation/" + params.id + "/nicknames", {
          nickname: new_nickname,
        });

        if (status !== "OK") throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: () => {
      query_client.setQueryData<Conversation>(["conversation", params.id], (prev) => {
        if (!prev) return;

        return {
          ...prev,
          nicknames: prev.nicknames.map((nickname) => (nickname.user === new_nickname.user ? new_nickname : nickname)),
        };
      });
      query_client.setQueryData<Conversation[]>([session?.user.id, "conversations"], (prev) => {
        if (!prev) return;
        return prev.map((conversation) =>
          conversation.id === params.id
            ? {
                ...conversation,
                nicknames: conversation.nicknames.map((nickname) =>
                  nickname.user === new_nickname.user ? new_nickname : nickname
                ),
              }
            : conversation
        );
      });
      setNewNickname({ user: "", value: "" });
      setSelected("");
    },
  });

  useEffect(() => {
    if (!conversation) return;

    setNickname(conversation.nicknames);
  }, [conversation]);

  return (
    <Dialog
      onOpenChange={(is_open) => {
        if (!is_open) {
          setNewNickname({ user: "", value: "" });
          setSelected("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <span className="aspect-square h-fit w-auto bg-secondary p-2 rounded-full">
            <CaseSensitive className="h-4 w-auto text-primary" />
          </span>
          <span>Add nicknames</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[40dvw] gap-10">
        <DialogHeader>
          <DialogTitle>Add Nicknames</DialogTitle>
        </DialogHeader>
        <DialogClose asChild className="absolute top-4 right-2">
          <Button variant="ghost" className="aspect-square h-fit w-auto p-2 rounded-full">
            <X className="h-4 w-auto" />
          </Button>
        </DialogClose>
        <div className="grid space-y-2">
          {nicknames.map(({ user: id, value: nickname }) => {
            return selected === id ? (
              <form
                key={id}
                className="flex items-start gap-2 h-fit w-full p-2"
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  set_nickname.mutate();
                }}
              >
                <div className="flex items-center gap-2 w-full">
                  <UserAvatar
                    src={
                      id === session?.user.id
                        ? session.user.photo?.url
                        : conversation?.members.find((member) => member.id === id)?.photo?.url
                    }
                    is_online={
                      id === session?.user.id
                        ? false
                        : conversation?.members.find((member) => member.id === id)?.status === "ONLINE"
                    }
                  />
                  <div className="grid w-full gap-1">
                    <div className="relative">
                      <Input
                        autoFocus
                        placeholder="Set nickname"
                        className="w-full"
                        onBlur={() => {
                          if (selected === id && !new_nickname.value) setSelected("");
                        }}
                        value={new_nickname.value}
                        onChange={(e) => setNewNickname({ user: id, value: e.currentTarget.value })}
                      />
                      {!!new_nickname.value && (
                        <Button
                          type="button"
                          variant="outline"
                          className="aspect-square h-fit w-auto p-1 rounded-full absolute top-1/2 right-2 -translate-y-1/2"
                          onClick={() => setNewNickname((prev) => ({ ...prev, value: "" }))}
                        >
                          <X className="h-4 w-auto" />
                        </Button>
                      )}
                    </div>
                    <span className="text-xs italic">
                      {conversation?.members.find((member) => member.id === id)?.display_name}
                    </span>
                  </div>
                </div>
                <Button type="submit" variant="secondary" className="aspect-square h-fit w-auto p-2">
                  <Check className="h-4 w-auto text-green-500" />
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                key={id}
                className="justify-between h-fit w-full p-2"
                onClick={() => {
                  setSelected(id);
                  setNewNickname({ user: id, value: nickname });
                }}
              >
                <div className="flex items-center gap-2">
                  <UserAvatar
                    src={
                      id === session?.user.id
                        ? session.user.photo?.url
                        : conversation?.members.find((member) => member.id === id)?.photo?.url
                    }
                    is_online={
                      id === session?.user.id
                        ? false
                        : conversation?.members.find((member) => member.id === id)?.status === "ONLINE"
                    }
                  />
                  <div className="grid text-start">
                    {nickname ? (
                      <span className="font-bold text-base">{nickname}</span>
                    ) : (
                      <span className="italic text-muted-foreground w-fit">Set nickname</span>
                    )}
                    <span className="text-xs italic font-medium">
                      {conversation?.members.find((member) => member.id === id)?.display_name}
                    </span>
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
