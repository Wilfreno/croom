"use client";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Conversation, User } from "@/lib/types/server-data-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AtSign, Mail, Send, UserRound, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GETRequest } from "@/lib/server/requests";
import { useAuth } from "@/components/providers/AuthProvider";

export default function UserInfoDialog({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const query_client = useQueryClient();
  const router = useRouter();
  const { session } = useAuth();

  async function startConversation() {
    try {
      const { data } = await GETRequest<Conversation[]>(
        "/v1/conversation?members=" + session.user?.id + "," + user.id
      );

      if (!!data.length) {
        router.push("/conversation/" + data[0].id);
      } else {
        query_client.setQueryData<string[][]>(
          ["compose", "selected_users"],
          [[user_info!.id, user_info!.display_name]]
        );
        router.push("/compose");
      }
    } catch {
      toast.error("Oops! something went wrong");
    }
  }

  const { data: user_info } = useQuery<User>({
    queryKey: ["user", user.id],
    queryFn: () => user,
  });

  const last_online = useMemo(() => {
    if (!user_info || user_info.status === "ONLINE") return "";
    const last_online = new Date(user_info.last_online);
    const now = new Date();
    const relative_date_in_seconds = Math.floor(
      (now.getTime() - last_online.getTime()) / 1000
    );

    const day = 60 * 60 * 24;
    const hour = 60 * 60;
    const minute = 60;

    if (relative_date_in_seconds > day)
      return Math.floor(relative_date_in_seconds / day) + " day(s)";
    if (relative_date_in_seconds > hour)
      return Math.floor(relative_date_in_seconds / hour) + " hour(s)";
    if (relative_date_in_seconds > minute)
      return Math.floor(relative_date_in_seconds / minute) + " minute(s)";
    return relative_date_in_seconds + " seconds(s)";
  }, [user_info]);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[30rem]">
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <DialogClose className="absolute top-4 right-4">
          <X className="h-4 w-auto" />
        </DialogClose>
        <div className="flex items-start gap-8">
          <Avatar className="aspect-square h-28 w-auto">
            <AvatarImage src={user_info?.photo?.url} />
            <AvatarFallback>
              <UserRound className="h-1/2 w-auto" />
            </AvatarFallback>
          </Avatar>
          <div className="grid gap-5">
            <div className="grid">
              <span className="text-xl font-semibold ">{user_info?.display_name}</span>
              {user_info?.status === "ONLINE" ? (
                <div className="relative font-semibold w-fit flex items-center gap-2 text-xs">
                  <span>Online</span>
                  <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                </div>
              ) : (
                <p className="text-xs font-medium">online {last_online} ago</p>
              )}
            </div>
            <div className="grid gap-1">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-auto" />
                <span>{user_info?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AtSign className="h-4 w-auto" />
                <span>{user_info?.username.slice(1)}</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="justify-start w-fit"
              onClick={startConversation}
            >
              <Send className="h-4 w-auto" />
              <span>Message</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
