import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import useDebounce from "@/hooks/useDebounce";
import { DELETERequest, GETRequest, PATCHRequest } from "@/lib/server/requests";
import { Invite, User } from "@/lib/types/server";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AtSign,
  Check,
  Copy,
  LoaderCircle,
  Pencil,
  Trash,
  UserRound,
} from "lucide-react";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function LobbyInvite({ invite }: { invite: Invite }) {
  const [copied, setCopied] = useState(false);
  const [username, setUsername] = useState("");
  const debounced_username = useDebounce(username);
  const [expires_in, setExpiresIn] = useState({
    text: "PERMANENT",
    edit: false,
    day: 0,
    hour: 0,
    minute: 0,
  });
  const [is_expired, setIsExpired] = useState(false);

  const query_client = useQueryClient();
  const params = useParams<{ id: string }>();
  const client_url = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_CLIENT_URL)
      throw new Error(
        "NEXT_PUBLIC_CLIENT_URL is missing from your .env.local file"
      );

    return process.env.NEXT_PUBLIC_CLIENT_URL;
  }, []);

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
        toast(message);
        throw new Error(message);
      }

      return result;
    },
    placeholderData: [],
  });

  const updateInviteMutation = useMutation<
    void,
    Error,
    { day: number; hour: number; minute: number },
    unknown
  >({
    mutationFn: async ({ day, hour, minute }) => {
      const day_to_seconds = day * 24 * 60 * 60;
      const hour_to_seconds = hour * 60 * 60;
      const minute_to_seconds = minute * 60;
      const { status, message } = await PATCHRequest("/v1/invite/expires_in", {
        id: invite.id,
        expires_in: day_to_seconds + hour_to_seconds + minute_to_seconds,
      });

      if (status !== "OK") {
        toast.error(message);
        throw new Error(message);
      }

      return;
    },
    onSuccess: () => {
      query_client.invalidateQueries({
        queryKey: ["invites", params.id],
        exact: true,
      });
      setExpiresIn((prev) => ({ ...prev, edit: false }));
    },
  });

  const deleteInviteMutation = useMutation<
    void,
    Error,
    { id: string },
    unknown
  >({
    mutationFn: async ({ id }) => {
      const { status, message } = await DELETERequest("/v1/invite", {
        id,
      });

      if (status !== "OK") {
        toast.error(message);
        throw new Error(message);
      }

      return;
    },
    onSuccess: (_, { id }) => {
      query_client.setQueryData<Invite[]>(["invites", params.id], (old_data) =>
        old_data?.filter((data) => data.id !== id)
      );
    },
  });

  async function copyUrl() {
    await navigator.clipboard.writeText(
      client_url + "/lobby/invite/" + invite.id + "?token=" + invite.token
    );
    setCopied(true);
  }

  async function editExpiresIn(event: FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault();

      let day = expires_in.day;
      let hour = expires_in.hour;
      let minute = expires_in.minute;
      if (minute > 60) {
        hour += Math.floor(minute / 60);
        minute %= 60;
      }
      if (hour > 24) {
        day += Math.floor(hour / 24);
        hour %= 24;
      }

      updateInviteMutation.mutate({ day, hour, minute });
    } catch (error) {
      throw error;
    }
  }

  useEffect(() => {
    if (!invite.expires_in) return;

    let excess = Math.floor((invite.expires_in - new Date().getTime()) / 1000);
    if (excess <= 0) {
      setIsExpired(true);
      return;
    }

    const id = setInterval(() => {
      excess -= 1;
      const units = {
        day: 24 * 60 * 60 * 1000,
        hour: 60 * 60 * 1000,
        minute: 60 * 1000,
        seconds: 1000,
      };

      let text = "";

      const day = Math.floor(excess! / units.day);
      text += `${day} days(s) `;
      excess! %= units.day;
      setExpiresIn((prev) => ({ ...prev, day }));

      const hour = Math.floor(excess! / units.hour);
      text += `${hour} hour(s) `;
      excess! %= units.hour;
      setExpiresIn((prev) => ({ ...prev, hour }));

      const minute = Math.floor(excess! / units.minute);
      text += `${minute} minute(s) `;
      excess! %= units.minute;
      setExpiresIn((prev) => ({ ...prev, minute }));

      text += `${excess} second(s) `;

      setExpiresIn((prev) => ({ ...prev, text }));
      if (excess <= 0) {
        clearInterval(id);
        setIsExpired(true);
        query_client.invalidateQueries({
          queryKey: ["invites", params.id],
          exact: true,
        });
        return;
      }
    }, 1000);

    return () => clearInterval(id);
  }, [invite]);

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Button
          disabled={is_expired}
          size="icon"
          variant="secondary"
          onClick={copyUrl}
          className="w-fit gap-4 p-1 px-2"
        >
          <span>
            {client_url}/lobby/invite/{invite.id}?token={invite.token}
          </span>
          {copied ? (
            <Check className="h-4 w-auto stroke-green-500" />
          ) : (
            <Copy className="h-4 w-auto " />
          )}
        </Button>
        <Button
          variant="destructive"
          onClick={() => deleteInviteMutation.mutate({ id: invite.id })}
        >
          <Trash className="h-4 w-auto" />
        </Button>
      </div>

      <div className="space-y-2 ">
        <Label htmlFor={"invite" + invite.id}>Invite people</Label>
        <div className="w-[40vw]">
          <div className="relative">
            <AtSign className="h-4 w-auto absolute left-4 top-1/2 -translate-y-1/2" />
            <Input
              id={"invite" + invite.id}
              placeholder="Username"
              className="px-10"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {isFetchingUser && (
              <LoaderCircle className="h-4 w-auto animate-spin  absolute right-10 top-1/2 -translate-y-1/2" />
            )}
          </div>
          <div className="flex gap-2 flex-wrap p-2 bg-">
            {search_result?.map((result) => (
              <Button key={result.id} variant="outline">
                <Avatar>
                  <AvatarImage src={result.photo.url} />
                  <AvatarFallback className="p-2">
                    <UserRound className="h-full w-auto" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4">
        <span className="flex items-center gap-4">
          <span className="font-medium text-xs text-muted-foreground">
            Expires in:
          </span>
          {is_expired ? ( 
            <span className="font-bold text-destructive">EXPIRED</span>
          ) : (
            <span className="font-medium text-xs">{expires_in.text}</span>
          )}
          <Button
            type="button"
            className={cn("icon h-fit", expires_in.edit && "hidden")}
            size="sm"
            variant="outline"
            onClick={() => setExpiresIn((prev) => ({ ...prev, edit: true }))}
          >
            Edit
          </Button>
        </span>
        <form
          className={cn(
            "items-center gap-4 w-2/3",
            expires_in.edit ? "flex" : "hidden"
          )}
          onSubmit={editExpiresIn}
          autoComplete="off"
        >
          <div className="flex items-center gap-2">
            <Label htmlFor="day">Day{"(s)"}</Label>
            <Input
              className="text-center px-0"
              type="text"
              id="day"
              inputMode="numeric"
              placeholder="Days"
              value={expires_in.day}
              onChange={(e) => {
                if (!e.target.value) {
                  setExpiresIn((prev) => ({
                    ...prev,
                    day: 0,
                  }));
                  return;
                }
                if (!Number(e.target.value)) return;
                setExpiresIn((prev) => ({
                  ...prev,
                  day: Number(e.target.value),
                }));
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="hour">Hour{"(s)"}</Label>
            <Input
              className="text-center px-0"
              type="text"
              id="hour"
              inputMode="numeric"
              placeholder="hour"
              value={expires_in.hour}
              onChange={(e) => {
                if (!e.target.value) {
                  setExpiresIn((prev) => ({
                    ...prev,
                    hour: 0,
                  }));
                  return;
                }
                if (!Number(e.target.value)) return;
                setExpiresIn((prev) => ({
                  ...prev,
                  hour: Number(e.target.value),
                }));
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="minute">Minute{"(s)"}</Label>
            <Input
              className="text-center"
              type="text"
              id="minute"
              inputMode="numeric"
              placeholder="Days"
              value={expires_in.minute}
              onChange={(e) => {
                if (!e.target.value) {
                  setExpiresIn((prev) => ({
                    ...prev,
                    minute: 0,
                  }));
                  return;
                }
                if (!Number(e.target.value)) return;
                setExpiresIn((prev) => ({
                  ...prev,
                  minute: Number(e.target.value),
                }));
              }}
            />
          </div>
          <Button type="submit" className="icon h-fit">
            Edit
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="icon h-fit"
            onClick={() => setExpiresIn((prev) => ({ ...prev, edit: false }))}
          >
            Close
          </Button>
        </form>
      </div>
    </div>
  );
}
