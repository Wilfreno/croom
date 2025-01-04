"use client";
import useDebounce from "@/components/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { GETRequest, PATCHRequest } from "@/lib/server/requests";
import { Conversation, User } from "@/lib/types/server-data-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserRoundPlus, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import UserAvatar from "../../UserAvatar";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function ManageMember() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  const { data: session } = useSession();
  const debounced_value = useDebounce(value);
  const params = useParams<{ id: string }>();
  const div_ref = useRef<HTMLDivElement>(null);

  const query_client = useQueryClient();
  const { data: conversation } = useQuery<Conversation>(getConvoOptions(params.id));

  const { data: result } = useQuery({
    queryKey: ["search", "user", debounced_value],
    queryFn: async () => {
      try {
        if (!debounced_value) return [];
        const { data, status, message } = await GETRequest<User[]>("/v1/user/search?value=" + debounced_value);

        if (status !== "OK") {
          toast.error(message);
          throw new Error(message);
        }

        return data;
      } catch (error) {
        throw error;
      }
    },
    placeholderData: [],
  });

  const members = useMutation<User, Error, { id: string; action: "ADD" | "REMOVE"; index: number; username: string }>({
    mutationFn: async ({ id, action, username }) => {
      try {
        let user: User;
        if (action === "ADD") {
          const { data, status: get_status, message: get_message } = await GETRequest<User>("/v1/user/" + username);
          if (get_status !== "OK") throw new Error(get_message);
          user = data;
        }

        const { status: patch_status, message: patch_message } = await PATCHRequest(
          "/v1/conversation/" + params.id + "/members",
          {
            member: id,
            action,
          }
        );

        if (patch_status !== "OK") throw new Error(patch_message);

        return user!;
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: (user, { action, index }) => {
      query_client.setQueryData<Conversation>(["conversation", params.id], (prev) => {
        if (!prev) return;
        switch (action) {
          case "ADD": {
            return { ...prev, members: [...prev.members, user] };
          }
          case "REMOVE": {
            return { ...prev, members: prev.members.toSpliced(index, 1) };
          }
        }
      });
    },
  });

  const is_admin = useMemo(() => {
    if (!session || !conversation) return false;

    return conversation.admins.some((user) => user.id === session.user.id);
  }, [session, conversation]);
  useEffect(() => {
    function handleCLick(event: MouseEvent) {
      if (div_ref.current && !div_ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleCLick);
    return () => {
      document.removeEventListener("mousedown", handleCLick);
    };
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={!is_admin}>
          <UserRoundPlus className="h-4 w-auto text-primary" />
          <span>Manage Members</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[40dvw] ">
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <DialogClose asChild>
          <Button variant="ghost" className="absolute top-2 right-2  aspect-square h-fit w-auto rounded-full p-1">
            <X className="h-4 w-auto" />
          </Button>
        </DialogClose>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <span className="text-lg font-semibold">Search to add or remove user</span>
            <div className="relative">
              <Search className="absolute top-1/2 left-2 h-4 w-auto -translate-y-1/2" />
              <Input
                value={value}
                placeholder="Username"
                className="px-8"
                onFocus={() => setOpen(true)}
                onChange={(e) => setValue(e.target.value)}
              />
              {!!value && (
                <Button
                  variant="ghost"
                  className="absolute top-1/2 right-2 -translate-y-1/2 aspect-square h-fit w-auto rounded-full p-1"
                  onClick={() => setValue("")}
                >
                  <X className="h-4 w-auto" />
                </Button>
              )}
              <div
                ref={div_ref}
                className={cn(
                  "absolute top-full left-0 w-full border bg-background z-50 my-1 rounded-sm shadow-md",
                  !open && "hidden"
                )}
              >
                <ScrollArea className="h-[30dvh]">
                  <div className="p-2 grid gap-2">
                    {result?.map((user, index) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-start gap-2">
                          <UserAvatar src={user.photo?.url} is_online={user.status === "ONLINE"} />
                          <div>
                            <p className="font-semibold">{user.display_name}</p>
                            <p className="text-xs text-muted-foreground">{user.username}</p>
                          </div>
                        </div>
                        {conversation?.members.some((member) => member.id === user.id) ? (
                          <Button
                            disabled={members.isPending && members.variables.id === user.id}
                            variant="destructive"
                            onClick={() =>
                              members.mutate({ action: "REMOVE", id: user.id, index, username: user.username })
                            }
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            disabled={members.isPending && members.variables.id === user.id}
                            variant="secondary"
                            onClick={() =>
                              members.mutate({ action: "ADD", id: user.id, index, username: user.username })
                            }
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <span className="text-lg font-semibold">Members</span>
            <ScrollArea className="h-[30dvh]">
              <div className="grid gap-2 p-2">
                {conversation?.members.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserAvatar src={user.photo?.url} is_online={user.status === "ONLINE"} />
                      <div>
                        <p className="font-semibold">{user.display_name}</p>
                        <p className="text-xs text-muted-foreground">{user.username}</p>
                      </div>
                    </div>
                    {user.id === session?.user.id ? (
                      <span className="text-muted-foreground font-medium px-8">You</span>
                    ) : (
                      <Button
                        disabled={members.isPending && members.variables.id === user.id}
                        variant="destructive"
                        onClick={() =>
                          members.mutate({ action: "REMOVE", id: user.id, index, username: user.username })
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
