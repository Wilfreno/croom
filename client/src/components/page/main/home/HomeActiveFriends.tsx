"use client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import UserAvatar from "../UserAvatar";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { GETRequest } from "@/lib/server/requests";

export default function HomeActiveFriends() {
  const { data: session } = useSession();

  const { data: active_friends } = useQuery({
    enabled: !!session,
    queryKey: [session, "active friends"],
    queryFn: async () => {
      try {
        const { data, status, message } = await GETRequest<{ name: string; url?: string }[]>("/v1/user/active-friends");

        if (status !== "OK") throw new Error(message);
        return data;
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    placeholderData: [],
  });

  return (
    <section className="w-full flex flex-col gap-1">
      <p className="font-bold">Active friends</p>
      <div className="flex items-center gap-2 mx-auto">
        <ScrollArea className="w-80 py-2 pb-3  h-fit">
          <div className="flex items-center gap-2">
            {active_friends!.map((active_friend) => (
              <div key={active_friend.name} className="flex flex-col items-center gap-1">
                <UserAvatar is_online src={active_friend.url} />
                <span className="text-xs font-medium">{active_friend.name}</span>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}
