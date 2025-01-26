"use client";
import { useQuery } from "@tanstack/react-query";
import SidebarContent from "../SidebarContent";
import { cn } from "@/lib/utils";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { useParams } from "next/navigation";
import InfoCustomization from "./InfoCustomization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRound } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";
import InfoMedia from "./InfoMedia";
import InfoPrivacyAndSupport from "./InfoPrivacyAndSupport";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMemo } from "react";
import { Block } from "@/lib/types/server-data-types";

const InfoAdminsAndMembers = dynamic(() => import("./InfoAdminsAndMembers"), {
  ssr: false,
});

export default function InfoSidebar() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const { data: is_open } = useQuery({
    queryKey: ["sidebar", "info", "open"],
  });
  const { data: query_response } = useQuery(getConvoOptions(params.id));

  const { data: conversation_info } = useQuery<
    | {
        photo_url: string;
        conversation_name: string;
        status: "OFFLINE" | "ONLINE" | null;
        last_online: string;
      }
    | undefined
  >({
    enabled: !!session.user?.id && !!query_response,
    queryKey: ["conversation", "info", query_response],
    placeholderData: {
      photo_url: undefined!,
      conversation_name: "",
      status: null,
      last_online: "",
    },
  });
  const { photo_url, conversation_name, status, last_online } = conversation_info!;

  const hide = useMemo(() => {
    if (!query_response || !session.user) return true;

    return (
      query_response.status === "BLOCKED" &&
      session.user.id !== (query_response?.data as Block).blocker
    );
  }, [query_response, session.user]);

  return (
    <SidebarContent className={cn(is_open ? "sm:inline-block" : "hidden")}>
      <div className="flex flex-col items-center gap-4 my-10">
        <span className="relative">
          <Avatar className="aspect-square h-28 w-auto">
            <AvatarImage src={photo_url} />
            <AvatarFallback>
              <UserRound className="h-1/2 w-auto" />
            </AvatarFallback>
          </Avatar>
          {status === "ONLINE" && (
            <div className="bg-green-500 aspect-square h-8 border-2 border-background w-auto rounded-full absolute bottom-1 right-0"></div>
          )}
        </span>
        <div className="text-center">
          <p className="font-medium text-lg truncate max-w-72">{conversation_name}</p>
          {!!last_online && (
            <p className="text-xs font-medium text-muted-foreground">
              Online {last_online}
            </p>
          )}
        </div>
      </div>
      {!hide && (
        <ScrollArea className="h-[60dvh]">
          <div className="grid gap-2">
            <InfoCustomization />
            <InfoAdminsAndMembers />
            <InfoMedia />
            <InfoPrivacyAndSupport />
          </div>
        </ScrollArea>
      )}
    </SidebarContent>
  );
}
