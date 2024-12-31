"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { Conversation } from "@/lib/types/server-data-types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, UserRound, UserRoundCog, UserRoundPlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import UserInfoDialog from "../UserInfoDialog";
import UserAvatar from "../../UserAvatar";

export default function Admins() {
  const [open, setOpen] = useState(false);

  const { data: session } = useSession();
  const params = useParams<{ id: string }>();
  const { data: conversation } = useQuery<Conversation>(getConvoOptions(params.id));

  const is_admin = useMemo(() => {
    if (!conversation || !session) return false;
    return conversation.admins.some((user) => user.id === session?.user.id);
  }, [session, conversation]);

  return (
    <Collapsible>
      <CollapsibleTrigger asChild className="w-full">
        <Button variant="ghost" className="w-full justify-between" onClick={() => setOpen((prev) => !prev)}>
          <span className="flex items-center gap-2">
            <span className="aspect-square h-fit w-auto p-2 rounded-full bg-secondary text-primary">
              <UserRoundCog className="h-4 w-auto" />
            </span>
            <span>Admins</span>
          </span>
          {open ? <ChevronDown className="h-4 w-auto" /> : <ChevronRight className="h-4 w-auto" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 p-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              className={cn(is_admin ? "w-full p-2  font-medium text-primary" : "hidden")}
              disabled={!is_admin}
            >
              <span className="aspect-square h-fit w-auto rounded-full p-2 ">
                <UserRoundPlus className="h-4 w-auto" />
              </span>
              <span>Manage admin</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="gap-8">
            <DialogHeader>
              <DialogTitle>Manage admin</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[40dvh]">
              <div className="grid gap-2">
                {conversation?.members.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={user.photo?.id} />
                        <AvatarFallback>
                          <UserRound className="h-1/2 w-auto" />
                        </AvatarFallback>
                      </Avatar>
                      <p className="truncate max-w-80">{user.display_name}</p>
                    </div>
                    {user.id === session?.user.id ? (
                      <p className="text-xs font-semibold text-muted-foreground mr-4">You</p>
                    ) : conversation?.admins.some((admin) => admin.id === user.id) ? (
                      <Button size="sm" variant="destructive">
                        Remove
                      </Button>
                    ) : (
                      <Button size="sm">Add</Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        <ScrollArea className="h-[30dvh] ">
          <div className="grid gap-2">
            {conversation?.admins.map((user) => (
              <UserInfoDialog key={user.id} username={user.username}>
                <Button variant="ghost" className="h-fit w-full p-1 justify-start">
                  <UserAvatar is_online={user.status === "ONLINE"} src={user.photo?.url} />
                  <p className="text-sm font-medium">{user.display_name}</p>
                </Button>
              </UserInfoDialog>
            ))}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}
