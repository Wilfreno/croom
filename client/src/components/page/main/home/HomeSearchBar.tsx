"use client";
import useDebounce from "@/components/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GETRequest } from "@/lib/server/requests";
import { ChatRoom, User } from "@/lib/types/server-data-types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function HomeSearchBar() {
  const [open, setOpen] = useState(false);
  const [input_value, setInputValue] = useState("");
  const debounced_value = useDebounce(input_value);

  const { data: search_result, isFetching } = useQuery({
    enabled: !!debounced_value,
    queryKey: ["search", debounced_value],
    queryFn: async () => {
      try {
        const { data, status, message } = await GETRequest<((User | ChatRoom) & { type: "USER" | "CHAT_ROOM" })[]>(
          "/v1/user/search?value=" + debounced_value
        );

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
  return (
    <div className="relative">
      <Label htmlFor="search" className="absolute top-1/2 left-2 -translate-y-1/2">
        <Search className="h-4" />
      </Label>
      <Input
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        autoComplete="off"
        placeholder="Search"
        id="search"
        className="pl-8"
      />
      <div
        className={cn(
          "absolute top-full left-0 w-full h-[30dvh] border rounded-lg shadow-md my-1 p-2",
          open ? "inline-block" : "hidden"
        )}
      >
        <ScrollArea className="h-full">
          <div className="p-2">
            <p></p>
            {search_result?.map((result) => {
              switch (result.type) {
                case "USER": {
                  const user = result as User;
                  return <div></div>;
                }
                case "CHAT_ROOM": {
                  const chatroom = result as ChatRoom;
                  return <div></div>;
                }
              }
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
