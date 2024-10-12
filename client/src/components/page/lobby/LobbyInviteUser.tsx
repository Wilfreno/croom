import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useDebounce from "@/hooks/useDebounce";
import { GETRequest, PATCHRequest } from "@/lib/server/requests";
import { Invite, User } from "@/lib/types/server-response-data";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AtSign, LoaderCircle, Snail, UserRound, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

export default function LobbyInviteUser({ invite }: { invite: Invite }) {
  const [username, setUsername] = useState("");
  const debounced_username = useDebounce(username);

  const query_client = useQueryClient();
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();

  const { data: search_result, isFetching: isFetchingUser } = useQuery({
    enabled: !!debounced_username,
    queryKey: ["invite-search", invite.id, debounced_username],
    queryFn: async () => {
      const {
        data: result,
        status,
        message,
      } = await GETRequest<User[]>(
        "/v1/user/autocomplete?search=" + "@" + debounced_username
      );

      if (status !== "OK") {
        toast.error(message);
        throw new Error(message);
      }

      return result;
    },
    placeholderData: [],
  });

  const updateUserInvite = useMutation<
    void,
    Error,
    { action: "DELETE" | "ADD"; user: User },
    unknown
  >({
    mutationFn: async ({ action, user }) => {
      if (user.id === session!.user.id) {
        toast.error("you cannot invite your self");
        throw new Error("you cannot invite your self");
      }

      const { status, message } = await PATCHRequest("/v1/invite/invited", {
        id: invite.id,
        invited: user.id,
        action,
      });

      toast(message);
      if (status !== "OK") {
        throw new Error(message);
      }
    },
    onSuccess: () => {
      query_client.invalidateQueries({
        queryKey: ["invites", params.id],
        exact: true,
      });
    },
  });

  return (
    <section className="border rounded-lg p-2 h-[30dvh]">
      <div className="flex items-center gap-8 px-4">
        <Label htmlFor={"invite" + invite.id} className="text-xs">
          Invite people
        </Label>
        <div className="relative">
          <AtSign className="h-4 w-auto absolute left-4 top-1/2 -translate-y-1/2" />
          <Input
            id={"invite" + invite.id}
            placeholder="Enter username"
            className="px-10"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
          />
          {isFetchingUser ? (
            <LoaderCircle className="h-4 w-auto animate-spin  absolute right-1 top-1/2 -translate-y-1/2" />
          ) : (
            username && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full  absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setUsername("")}
              >
                <X className="h-4" />
              </Button>
            )
          )}
          <div
            className={cn(
              "absolute border rounded-lg bg-background shadow-md w-full top-full my-2  gap-2 flex-wrap p-2 max-h-[35dvh] justify-evenly overflow-y-auto",
              username ? "flex" : "hidden"
            )}
          >
            {search_result!.length ? (
              search_result?.map((result) => (
                <Button
                  key={result.id}
                  variant="ghost"
                  className="h-fit w-auto flex-col text-center gap-1"
                  onClick={() =>
                    updateUserInvite.mutate({ action: "ADD", user: result })
                  }
                >
                  <Avatar>
                    <AvatarImage src={result.photo.url} />
                    <AvatarFallback>
                      <UserRound className="h-full w-auto" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{result.display_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {result.username}
                  </span>
                </Button>
              ))
            ) : (
              <span className="m-auto grid place-items-center">
                <Snail className="h-14 w-auto stroke-1 stroke-muted-foreground " />
                <p className="font-bold text-muted-foreground">...</p>
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-10 gap-2 p-4">
        {invite.invited.map((user) => (
          <div
            key={user.id}
            className="flex flex-col items-center gap-1 p-2 relative"
          >
            <Button
              variant="outline"
              className="h-fit w-auto rounded-full p-1 absolute top-0 -right-2"
              onClick={() =>
                updateUserInvite.mutate({ action: "DELETE", user })
              }
            >
              <X className="h-4 w-auto" />
            </Button>
            <Avatar>
              <AvatarImage src={user.photo.url} />
              <AvatarFallback>
                <UserRound className="h-full w-auto" />
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">{user.display_name}</span>
            <span className="text-xs text-muted-foreground">
              {user.username}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
