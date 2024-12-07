"use client";
import useDebounce from "@/components/hooks/useDebounce";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Conversation } from "@/lib/types/server-data-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export default function SearchConversation() {
  const [input_value, setInputValue] = useState("");
  const debounced_value = useDebounce(input_value);

  const query_client = useQueryClient();
  const search_conversation = useMutation<void, Error, string>({
    mutationFn: async (search_value) => {
      const conversations = query_client.getQueryData<Conversation[]>(["conversations"]);
      if (!conversations) return;

      query_client.invalidateQueries({ queryKey: ["conversation", "search"] });
      if (!search_value) {
        query_client.setQueryData(["conversation", "search"], []);
      } else {
        const result = conversations.filter((convo) => convo.name.toLowerCase().startsWith(search_value.toLowerCase()));
        query_client.setQueryData(["conversation", "search"], result);
      }
    },
  });

  useEffect(() => {
    search_conversation.mutate(debounced_value!);
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
