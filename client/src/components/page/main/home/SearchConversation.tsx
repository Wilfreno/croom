"use client";
import useDebounce from "@/components/hooks/useDebounce";
import { useAuth } from "@/components/providers/AuthProvider";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Conversation } from "@/lib/types/server-data-types";
import { useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export default function SearchConversation() {
  const [input_value, setInputValue] = useState("");
  const debounced_value = useDebounce(input_value);

  const { session } = useAuth();
  const query_client = useQueryClient();

  useEffect(() => {
    if (!debounced_value) {
      query_client.resetQueries({ exact: true, queryKey: ["conversation", "search"] });
    } else {
      const conversations = query_client.getQueryData<Conversation[]>([
        session.user?.id,
        "conversations",
      ]);
      if (!conversations) return;
      const result = conversations.filter(
        (convo) =>
          convo.name.toLowerCase().startsWith(debounced_value.toLowerCase()) ||
          convo.members[0].display_name
            .toLowerCase()
            .startsWith(debounced_value.toLowerCase())
      );
      query_client.setQueryData(["conversation", "search"], result);
    }
  }, [debounced_value]);

  return (
    <div className="relative">
      <Label htmlFor="search" className="absolute top-1/2 left-2 -translate-y-1/2">
        <Search className="h-4" />
      </Label>
      <Input
        autoComplete="off"
        placeholder="Search"
        id="search"
        className="pl-8"
        value={input_value}
        onChange={(e) => setInputValue(e.currentTarget.value)}
      />
    </div>
  );
}
