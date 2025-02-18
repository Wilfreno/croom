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
  const query_client = useQueryClient();
  const { on_mobile } = useUserAgent();
  const router = useRouter();

  const info_sidebar_is_open = query_client.getQueryData<boolean>([
    "sidebar",
    "info",
    "open",
    on_mobile,
  ]);
  const { data: query_response } = useQuery(getConvoOptions(params.id));

  const { data: conversation_info } = useQuery<{
    photo_url: string;
    conversation_name: string;
    status: "OFFLINE" | "ONLINE" | null;
    last_online: string;
  }>({
    queryKey: ["conversation", "info", query_response],
  });

  return (
    <section
      className={cn(
        "w-full border-b flex items-center justify-between  relative gap-4 p-3 shadow-lg h-full",
        on_mobile ? "p-2 w-dvw" : ""
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
            src={conversation_info?.photo_url}
            is_online={status === "ONLINE"}
          />
          <div>
            <p className="font-medium truncate max-w-96">
              {conversation_info?.conversation_name}
            </p>
            {!!conversation_info?.last_online && (
              <p className="text-xs font-medium text-muted-foreground">
                {conversation_info?.last_online}
              </p>
            )}
          </div>
        </div>
      </div>
      <Button
        className="aspect-square h-fit w-auto rounded-full p-1"
        onClick={() =>
          query_client.setQueryData<boolean>(["sidebar", "info", "open"], (prev) => !prev)
        }
      >
        <Ellipsis className={cn("w-auto", info_sidebar_is_open ? "h-2" : "h-4")} />
      </Button>
    </section>
  );
}
