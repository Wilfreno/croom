"use client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DELETERequest, GETRequest } from "@/lib/server/requests";
import { Block } from "@/lib/types/server-data-types";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function SettingsBlockedUsers() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const div_ref = useRef<HTMLDivElement>(null);

  const query_client = useQueryClient();

  const { data: blocked_list } = useQuery({
    enabled: open,
    queryKey: [session.user!.id, "blocked"],
    queryFn: async () => {
      try {
        const { data, status, message } = await GETRequest<Block[]>("/v1/user/blocked");

        if (status !== "OK") throw new Error(message);

        return data;
      } catch (error) {
        throw error;
      }
    },
  });

  const unblock = useMutation<void, Error, { id: string; index: number }>({
    mutationFn: async ({ id }) => {
      try {
        const {} = await DELETERequest("/v1/block", { id });
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: (_, { index }) => {
      query_client.setQueryData<Block[]>([session.user!.id, "blocked"], (prev) => {
        if (!prev) return [];

        return prev.toSpliced(index, 1);
      });
      toast("user unblocked");
    },
  });

  useEffect(() => {
    if (open) div_ref.current?.scrollIntoView();
  }, [open]);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Blocked Users</span>
        <Button variant="outline" onClick={() => setOpen((prev) => !prev)}>
          {open ? "Close" : "See list"}
        </Button>
      </div>
      <ScrollArea
        ref={div_ref}
        className={cn(open ? "h-[40dvh] rounded-sm border " : "hidden")}
      >
        <div>
          {blocked_list?.map(({ blocked_user, id }, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-4 p-2 pr-4",
                index % 2 === 0 ? "bg-muted/40" : "bg-background"
              )}
            >
              <Avatar>
                <AvatarImage src={blocked_user.photo?.url} />
                <AvatarFallback>
                  <UserRound className="h-1/2 w-auto" />
                </AvatarFallback>
              </Avatar>
              <span>{blocked_user.username}</span>
              <Button
                variant="outline"
                className="ml-auto text-destructive"
                onClick={() => unblock.mutate({ id, index })}
              >
                Unblock
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
