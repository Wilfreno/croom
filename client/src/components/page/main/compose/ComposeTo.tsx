"use client";
import useDebounce from "@/components/hooks/useDebounce";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GETRequest } from "@/lib/server/requests";
import { User } from "@/lib/types/server-data-types";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function ComposeTo() {
  const [selected_users, setSelectedUsers] = useState<string[][]>([]);
  const [open, setOpen] = useState(false);
  const [input_value, setInputValue] = useState("");

  const debounced_value = useDebounce(input_value);

  const dropdown_div_ref = useRef<HTMLDivElement>(null);
  const input_ref = useRef<HTMLInputElement>(null);

  const query_client = useQueryClient();
  const { data: result } = useQuery({
    queryKey: ["search", "add", " member", debounced_value],
    queryFn: async () => {
      try {
        if (!debounced_value) return [];
        const { data, status, message } = await GETRequest<User[]>("/v1/user/search?value=" + debounced_value);

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

  useEffect(() => {
    query_client.invalidateQueries({ exact: true, queryKey: ["compose", "selected_users"] });
    query_client.setQueryData(["compose", "selected_users"], selected_users);
  }, [selected_users]);

  useEffect(() => {
    function handleCLick(event: MouseEvent) {
      if (dropdown_div_ref.current && !dropdown_div_ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleCLick);
    return () => {
      document.removeEventListener("mousedown", handleCLick);
    };
  });

  return (
    <div className={cn("w-full border-b flex items-center p-3 relative gap-4", selected_users.length && "shadow-lg")}>
      <Label htmlFor="add-member">To: </Label>
      {selected_users.length > 5 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="aspect-square h-fit w-auto rounded-full p-2 mx-2">
              <ChevronDown className="h-4 w-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <ScrollArea className="h-[40dvh]">
              <div className="flex flex-col gap-2">
                {selected_users.slice(0, Math.min(selected_users.length - 5, 5)).map((value, index) => (
                  <div
                    key={value[0]}
                    className="h-fit w-full p-2 text-xs flex items-center justify-between gap-2 border rounded-lg"
                  >
                    <span>{value[1]}</span>
                    <Button
                      variant="outline"
                      className="aspect-square h-fit w-auto p-0 rounded-full"
                      onClick={() => setSelectedUsers((prev) => prev.toSpliced(index, 1))}
                    >
                      <X className="h-2" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {!!selected_users.length && (
        <div className="flex items-center gap-2">
          {selected_users.slice(-5).map((value, index) => (
            <div
              key={value[0]}
              className="flex items-center gap-2 h-fit w-fit p-2 text-xs whitespace-nowrap border shadow rounded-lg"
            >
              <span className="max-w-32 truncate">{value[1]}</span>
              <Button
                variant="outline"
                className="aspect-square h-fit w-auto p-1 rounded-full"
                onClick={() =>
                  setSelectedUsers((prev) =>
                    prev.toSpliced(selected_users.length < 5 ? index : index + (selected_users.length - 5), 1)
                  )
                }
              >
                <X className="h-2 w-auto" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div ref={dropdown_div_ref} className="grow">
        <Input
          ref={input_ref}
          id="add-member"
          className="focus-visible:ring-0 shadow-none border-none rounded-none "
          autoComplete="off"
          autoFocus
          onFocus={() => setOpen(true)}
          value={input_value}
          onChange={(e) => setInputValue(e.currentTarget.value)}
        />
        <div
          className={cn(
            "absolute top-3/4 left-10 w-80 h-[50dvh] bg-background shadow-lg border rounded-sm z-10",
            open ? "inline-block" : "hidden"
          )}
        >
          <ScrollArea className="h-full">
            <div className="py-2">
              {result!.map((user) => (
                <Button
                  key={user.id}
                  variant="ghost"
                  className="group rounded-none h-fit w-full justify-start py-2"
                  onClick={() => {
                    if (selected_users.some((selected) => selected[1] === user.display_name)) {
                      toast("Already selected");
                      return;
                    }
                    setSelectedUsers((prev) => [...prev, [user.id, user.display_name]]);
                    setOpen(false);
                    setInputValue("");
                    input_ref.current?.focus();
                  }}
                >
                  <span className="relative">
                    <Avatar>
                      <AvatarImage src={user.photo?.url} />
                      <AvatarFallback className="group-hover:bg-background">
                        <UserRound className="h-1/2" />
                      </AvatarFallback>
                    </Avatar>
                    {user.status === "ONLINE" && (
                      <div className="bg-green-500 aspect-square h-2 w-auto rounded-full absolute bottom-1 right-1"></div>
                    )}
                  </span>
                  <div>
                    <p className="font-semibold">{user.display_name}</p>
                    <p className="text-xs text-muted-foreground">{user.username}</p>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
