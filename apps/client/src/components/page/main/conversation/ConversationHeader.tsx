"use client";

import { Button } from "@/components/ui/button";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ellipsis } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import UserAvatar from "../UserAvatar";
import { cn } from "@/lib/utils";
import useUserAgent from "@/components/hooks/useUserAgent";

export default function ConversationHeader() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { onMobile } = useUserAgent();
  const router = useRouter();

  const infoSidebarIsOpen = queryClient.getQueryData<boolean>([
    "sidebar",
    "info",
    "open",
    onMobile,
  ]);
  const { data: queryResponse } = useQuery(getConvoOptions(params.id));

  const { data: conversationInfo } = useQuery<{
    photoUrl: string;
    conversationName: string;
    status: "OFFLINE" | "ONLINE" | null;
    lastOnline: string;
  }>({
    queryKey: ["conversation", "info", queryResponse],
  });

  return (
    <section
      className={cn(
        "w-full border-b flex items-center justify-between  relative gap-4  shadow-lg h-full",
        onMobile ? "p-2" : "p-3"
      )}
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          className="aspect-square h-fit w-auto p-1 md:hidden"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-auto" />
        </Button>
        <div className="flex items-center gap-4">
          <UserAvatar
            src={conversationInfo?.photoUrl}
            isOnline={status === "ONLINE"}
          />
          <div>
            <p className="font-medium truncate max-w-96">
              {conversationInfo?.conversationName}
            </p>
            {!!conversationInfo?.lastOnline && (
              <p className="text-xs font-medium text-muted-foreground">
                {conversationInfo?.lastOnline}
              </p>
            )}
          </div>
        </div>
      </div>
      <Button
        className="aspect-square h-fit w-auto rounded-full p-1"
        onClick={() =>
          queryClient.setQueryData<boolean>(
            ["sidebar", "info", "open", onMobile],
            (prev) => !prev
          )
        }
      >
        <Ellipsis className={cn("w-auto", infoSidebarIsOpen ? "h-2" : "h-4")} />
      </Button>
    </section>
  );
}
