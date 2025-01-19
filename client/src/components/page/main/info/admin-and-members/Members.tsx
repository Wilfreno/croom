"use client";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { Conversation } from "@/lib/types/server-data-types";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, UsersRound } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import UserInfoDialog from "../UserInfoDialog";
import UserAvatar from "../../UserAvatar";
import ManageMember from "./ManageMember";

export default function Members() {
  const [open, setOpen] = useState(false);

  const params = useParams<{ id: string }>();
  const { data: conversation } = useQuery<Conversation>(getConvoOptions(params.id));

  return (
    <Collapsible>
      <CollapsibleTrigger asChild className="w-full">
        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="flex items-center gap-2">
            <span className="aspect-square h-fit w-auto p-2 rounded-full bg-secondary text-primary">
              <UsersRound className="h-4 w-auto" />
            </span>
            <span>Members</span>
          </span>
          {open ? (
            <ChevronDown className="h-4 w-auto" />
          ) : (
            <ChevronRight className="h-4 w-auto" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-2 p-2">
        <ManageMember />
        <ScrollArea className="h-[30dvh] ">
          <div className="grid gap-2">
            {conversation?.members.map((user) => (
              <UserInfoDialog key={user.id} user={user}>
                <Button variant="ghost" className="h-fit w-full p-1 justify-start">
                  <UserAvatar
                    is_online={user.status === "ONLINE"}
                    src={user.photo?.url}
                  />
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
