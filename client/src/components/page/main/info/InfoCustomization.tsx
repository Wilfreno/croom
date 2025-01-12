"use client";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { Conversation } from "@/lib/types/server-data-types";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import ChangeName from "./customization/ChangeName";
import AddNickname from "./customization/AddNickname";
import ChangePhoto from "./customization/ChangePhoto";
export default function InfoCustomization() {
  const [is_open, setIsOpen] = useState(false);

  const params = useParams<{ id: string }>();
  const { data: conversation } = useQuery<Conversation>(getConvoOptions(params.id));
  return (
    <Collapsible onOpenChange={(is_open) => setIsOpen(is_open)}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between font-semibold">
          <span>Customization</span>
          {is_open ? <ChevronDown className="h-4 w-auto" /> : <ChevronRight className="h-4 w-auto" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 p-2">
        {conversation?.is_group_chat && (
          <>
            <ChangePhoto />
            <ChangeName />
          </>
        )}
        <AddNickname />
      </CollapsibleContent>
    </Collapsible>
  );
}
