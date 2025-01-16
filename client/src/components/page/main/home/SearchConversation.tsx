"use client";
import useDebounce from "@/components/hooks/useDebounce";
<<<<<<< HEAD
import { useAuth } from "@/components/providers/SessionProvider";
=======
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Conversation } from "@/lib/types/server-data-types";
import { useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
<<<<<<< HEAD
=======
import { useSession } from "next-auth/react";
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
import { useEffect, useState } from "react";

export default function SearchConversation() {
  const [input_value, setInputValue] = useState("");
  const debounced_value = useDebounce(input_value);

<<<<<<< HEAD
  const { session } = useAuth();
=======
  const { data: session } = useSession();
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
  const query_client = useQueryClient();

  useEffect(() => {
    if (!debounced_value) {
      query_client.resetQueries({ exact: true, queryKey: ["conversation", "search"] });
    } else {
<<<<<<< HEAD
      const conversations = query_client.getQueryData<Conversation[]>([
        session.user?.id,
        "conversations",
      ]);
=======
      const conversations = query_client.getQueryData<Conversation[]>([session?.user.id, "conversations"]);
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
      if (!conversations) return;
      const result = conversations.filter(
        (convo) =>
          convo.name.toLowerCase().startsWith(debounced_value.toLowerCase()) ||
<<<<<<< HEAD
          convo.members[0].display_name
            .toLowerCase()
            .startsWith(debounced_value.toLowerCase())
=======
          convo.members[0].display_name.toLowerCase().startsWith(debounced_value.toLowerCase())
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
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
