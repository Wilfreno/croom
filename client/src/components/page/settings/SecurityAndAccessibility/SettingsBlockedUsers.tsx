"use client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GETRequest } from "@/lib/server/requests";
import { Block } from "@/lib/types/server-data-types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useRef, useState } from "react";

export default function SettingsBlockedUsers() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const div_ref = useRef<HTMLDivElement>(null);

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

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-semibold">Blocked Users</span>
        <Button variant="outline" onClick={() => setOpen((prev) => !prev)}>
          {open ? "Close" : "See list"}
        </Button>
      </div>
      <div ref={div_ref} className={cn(open ? "grid gap-2 relative" : "hidden")}>
        <ScrollArea className="h-40dvh">
          {Array.from({ length: 20 }).map(() =>
            blocked_list?.map(({ blocked_user }) => (
              <div key={blocked_user.id} className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={blocked_user.photo?.url} />
                  <AvatarFallback>
                    <UserRound className="h-1/2 w-auto" />
                  </AvatarFallback>
                </Avatar>
                <span>{blocked_user.username}</span>
                <Button variant="destructive" className="justify-self-end">
                  Unblock
                </Button>
              </div>
            ))
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
