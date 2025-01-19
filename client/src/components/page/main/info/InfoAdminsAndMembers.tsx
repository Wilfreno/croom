"use client";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import Admins from "./admin-and-members/Admins";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { Conversation } from "@/lib/types/server-data-types";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { useParams } from "next/navigation";
import Members from "./admin-and-members/Members";

export default function InfoAdminsAndMembers() {
  const [is_open, setIsOpen] = useState(false);

  const params = useParams<{ id: string }>();
  const { data: conversation } = useQuery<Conversation>(getConvoOptions(params.id));

  if (!conversation?.is_group_chat) return null;

  return (
    <Collapsible onOpenChange={(is_open) => setIsOpen(is_open)}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between font-semibold">
          <span>Admins & Members</span>
          {is_open ? (
            <ChevronDown className="h-4 w-auto" />
          ) : (
            <ChevronRight className="h-4 w-auto" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 p-2">
        <Admins />
        <Members />
      </CollapsibleContent>
    </Collapsible>
  );
}
