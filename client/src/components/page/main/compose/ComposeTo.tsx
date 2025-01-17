"use client";
import useDebounce from "@/components/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GETRequest } from "@/lib/server/requests";
import { Conversation, User } from "@/lib/types/server-data-types";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import UserAvatar from "../UserAvatar";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ComposeTo() {
  const [open, setOpen] = useState(false);
  const [input_value, setInputValue] = useState("");
  const [see_list, setSeeList] = useState(false);

  const debounced_value = useDebounce(input_value);
  const { session } = useAuth();
  const query_client = useQueryClient();
  const router = useRouter();

  const user_dropdown_div_ref = useRef<HTMLDivElement>(null);
  const convo_dropdown_div_ref = useRef<HTMLDivElement>(null);
  const input_ref = useRef<HTMLInputElement>(null);

  const { data: result } = useQuery({
    queryKey: ["search", "user", debounced_value],
    queryFn: async () => {
      try {
        if (!debounced_value) return [];
        const { data, status, message } = await GETRequest<User[]>(
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

  const { data: selected_users } = useQuery<string[][]>({
    queryKey: ["compose", "selected_users"],
    placeholderData: [],
  });

  const { data: found_conversation } = useQuery({
    enabled: !!selected_users!.length,
    queryKey: ["conversation", "members", selected_users],
    queryFn: async () => {
      try {
        let members = "";

        for (const member of selected_users!) {
          members += "," + member[0];
        }

        const { data, message, status } = await GETRequest<Conversation[]>(
          "/v1/conversation?members=" + session.user?.id + members
        );

        if (status !== "OK") throw new Error(message);

        return data;
      } catch (error) {
        throw error;
      }
    },
    placeholderData: [],
  });

  useEffect(() => {
    query_client.invalidateQueries({
      exact: true,
      queryKey: ["compose", "selected_users"],
    });
    query_client.setQueryData(["compose", "selected_users"], selected_users);
  }, [selected_users]);

  useEffect(() => {
    function handleCLick(event: MouseEvent) {
      if (
        user_dropdown_div_ref.current &&
        !user_dropdown_div_ref.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
      if (
        convo_dropdown_div_ref.current &&
        !convo_dropdown_div_ref.current.contains(event.target as Node)
      ) {
        setSeeList(false);
      }
    }

    document.addEventListener("mousedown", handleCLick);
    return () => {
      document.removeEventListener("mousedown", handleCLick);
    };
  }, []);

  return (
    <section
      className={cn(
        "w-full border-b flex items-center p-3 relative gap-4 z-50 bg-background",
        selected_users!.length && "shadow-lg"
      )}
    >
      <AnimatePresence>
        {!!found_conversation &&
          found_conversation.length > 1 &&
          found_conversation?.some((convo) => convo.is_group_chat) && (
            <motion.div
              key="found-group-chats"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              // transition={{ type: "tween", ease: "easeInOut" }}
              className="absolute top-full left-0 w-full bg-background border shadow-md py-3 px-5 rounded-b text-sm z-40"
            >
              <strong>You</strong> ,
              {selected_users?.map(([id, name], index) => (
                <span key={id}>
                  {index === selected_users.length - 1 && "and "}
                  <strong>{name}</strong>
                  {index !== selected_users.length - 1 && ", "}
                </span>
              ))}{" "}
              <span>are already a member of </span>
              <span className="text-primary h-fit w-fit font-medium">
                {found_conversation.length} group chat&#40;s&#41;
              </span>{" "}
              <span>together.</span>{" "}
              <Button
                variant="ghost"
                className="h-fit w-fit p-1 text-primary underline"
                onClick={() => {
                  setOpen(false);
                  setSeeList((prev) => !prev);
                }}
              >
                see list
              </Button>
              <div
                className={cn(
                  "absolute left-0 top-[105%] w-full",
                  see_list ? "grid" : "hidden"
                )}
              >
                <ScrollArea className="h-52">
                  <div className="bg-background gap-1 grid py-2 pr-2">
                    {found_conversation.map((convo) => (
                      <Button
                        key={convo.id}
                        variant="ghost"
                        className="h-fit w-full p-2 justify-start rounded-sm"
                        onClick={() => router.push("/conversation/" + convo.id)}
                      >
                        <Avatar>
                          <AvatarImage src={convo.photo?.url} />
                          <AvatarFallback>
                            <UserRound className="h-1/2 w-auto" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold truncate max-w-[40vw]">
                          {convo.name}
                        </span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      <Label htmlFor="add-member">To: </Label>
      {selected_users!.length > 5 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="aspect-square h-fit w-auto rounded-full p-2 mx-2"
            >
              <ChevronDown className="h-4 w-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <ScrollArea className="h-[40dvh]">
              <div className="flex flex-col gap-2">
                {selected_users!
                  .slice(0, Math.min(selected_users!.length - 5, 5))
                  .map((value, index) => (
                    <div
                      key={value[0]}
                      className="h-fit w-full p-2 text-xs flex items-center justify-between gap-2 border rounded-lg"
                    >
                      <span>{value[1]}</span>
                      <Button
                        variant="outline"
                        className="aspect-square h-fit w-auto p-0 rounded-full"
                        onClick={() =>
                          query_client.setQueryData<string[][]>(
                            ["compose", "selected_users"],
                            (prev) => prev?.toSpliced(index, 1)
                          )
                        }
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
      {!!selected_users!.length && (
        <div className="flex items-center gap-2">
          {selected_users!.slice(-5).map((value, index) => (
            <div
              key={value[0]}
              className="flex items-center gap-2 h-fit w-fit p-2 text-xs whitespace-nowrap border shadow rounded-lg"
            >
              <span className="max-w-32 truncate">{value[1]}</span>
              <Button
                variant="outline"
                className="aspect-square h-fit w-auto p-1 rounded-full"
                onClick={() =>
                  query_client.setQueryData<string[][]>(
                    ["compose", "selected_users"],

                    (prev) =>
                      prev?.toSpliced(
                        prev.length < 5 ? index : index + (prev.length - 5),
                        1
                      )
                  )
                }
              >
                <X className="h-2 w-auto" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div ref={user_dropdown_div_ref} className="grow">
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
                    if (
                      selected_users!.some(
                        (selected) => selected[1] === user.display_name
                      )
                    ) {
                      toast("Already selected");
                      return;
                    }
                    query_client.setQueryData<string[][]>(
                      ["compose", "selected_users"],
                      (prev) => {
                        if (!prev) return [];
                        return [...prev, [user.id, user.display_name]];
                      }
                    );
                    setOpen(false);
                    setInputValue("");
                    input_ref.current?.focus();
                  }}
                >
                  <UserAvatar
                    src={user.photo?.url}
                    is_online={user.status === "ONLINE"}
                  />
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
    </section>
  );
}
